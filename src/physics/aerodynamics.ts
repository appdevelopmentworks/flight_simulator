import { Vector3, Euler } from 'three';
import { Aircraft, ControlInputs, WeatherConditions } from '@/types';
import { AIRCRAFT_SPECS, PHYSICS_CONSTANTS } from '@/constants';
import { logMediumError, logHighError, ERROR_CODES, validateAircraftType } from '@/utils/errorHandler';

// 大気密度を計算（高度による変化）
export function getAirDensity(altitude: number): number {
  const { AIR_DENSITY_SEA_LEVEL, TEMPERATURE_LAPSE_RATE, SEA_LEVEL_TEMPERATURE, GAS_CONSTANT } = PHYSICS_CONSTANTS;
  
  const temperature = SEA_LEVEL_TEMPERATURE + TEMPERATURE_LAPSE_RATE * altitude;
  const pressure = 101325 * Math.pow(temperature / SEA_LEVEL_TEMPERATURE, -9.81 / (TEMPERATURE_LAPSE_RATE * GAS_CONSTANT));
  
  return pressure / (GAS_CONSTANT * temperature);
}

// 揚力を計算
export function calculateLift(
  velocity: Vector3,
  airDensity: number,
  wingArea: number,
  liftCoefficient: number,
  angleOfAttack: number,
  aircraft: Aircraft
): Vector3 {
  const speed = velocity.length();
  const dynamicPressure = 0.5 * airDensity * speed * speed;
  
  // 迎角による揚力係数の調整
  let adjustedLiftCoeff = liftCoefficient;
  
  // F-16の場合は高迎角性能を考慮
  if (aircraft.type === 'f16') {
    // F-16は高迎角でも飛行可能（最大30度程度）
    if (angleOfAttack >= -0.1 && angleOfAttack <= 0.35) {
      adjustedLiftCoeff = liftCoefficient * (1 + angleOfAttack * 5);
    } else if (angleOfAttack > 0.35 && angleOfAttack <= 0.52) {
      // 高迎角での制御維持
      adjustedLiftCoeff = liftCoefficient * (2.75 - (angleOfAttack - 0.35) * 2);
    } else if (angleOfAttack > 0.52) {
      // ディープストール
      adjustedLiftCoeff = liftCoefficient * 0.4;
    }
  } else {
    // 他の航空機の標準的な特性
    if (angleOfAttack >= -0.1 && angleOfAttack <= 0.25) {
      adjustedLiftCoeff = liftCoefficient * (1 + angleOfAttack * 4);
    } else if (angleOfAttack > 0.25) {
      adjustedLiftCoeff = liftCoefficient * Math.max(0.3, 1 - (angleOfAttack - 0.25) * 3);
    }
  }
  
  const liftMagnitude = dynamicPressure * wingArea * adjustedLiftCoeff;
  
  // 揚力は機体の上方向
  const up = new Vector3(0, 1, 0).applyEuler(aircraft.rotation);
  return up.multiplyScalar(liftMagnitude);
}

// 抗力を計算
export function calculateDrag(
  velocity: Vector3,
  airDensity: number,
  wingArea: number,
  dragCoefficient: number,
  aircraft: Aircraft
): Vector3 {
  const speed = velocity.length();
  if (speed === 0) return new Vector3(0, 0, 0);
  
  const dynamicPressure = 0.5 * airDensity * speed * speed;
  
  // ランディングギアによる抗力増加
  let adjustedDragCoeff = dragCoefficient;
  if (aircraft.landingGear) {
    adjustedDragCoeff *= 1.3; // ギア展開時は抗力30%増
  }
  
  const dragMagnitude = dynamicPressure * wingArea * adjustedDragCoeff;
  
  // 抗力は速度と反対方向
  return velocity.clone().normalize().multiplyScalar(-dragMagnitude);
}

// 推力を計算
export function calculateThrust(
  throttle: number,
  enginePower: number,
  airDensity: number,
  altitude: number,
  forward: Vector3,
  airspeedKmh: number,
  aircraftType: string = 'cessna172'
): Vector3 {
  // 高度による推力の減少
  const densityRatio = airDensity / PHYSICS_CONSTANTS.AIR_DENSITY_SEA_LEVEL;
  const altitudeFactor = Math.pow(densityRatio, 0.7);
  
  let thrust = 0;
  
  if (aircraftType === 'boeing737') {
    // Boeing 737のジェットエンジン計算（0.8倍速調整）
    const maxThrustPerEngine = 1920000; // N (0.8倍速調整）
    const totalMaxThrust = maxThrustPerEngine * 2;
    const jetEfficiency = 5.0; // 離陸時の高効率（調整）
    // 地上では推力をバランスブースト
    const jetAltitudeFactor = altitude < 3000 ? 4.0 : Math.pow(densityRatio, 0.05);
    thrust = throttle * totalMaxThrust * jetAltitudeFactor * jetEfficiency;
  } else if (aircraftType === 'f16') {
    // F-16のジェットエンジン計算（5倍速強化）
    const maxThrust = 1100000; // N (5倍強化 - 極限パワー)
    const maxThrustAB = 1100000 * 3.0; // N (アフターバーナー極限強化)
    
    // アフターバーナーの閾値（即座に作動）
    const abThreshold = 0.5;
    
    // 地上での推力を極限ブースト
    const f16AltitudeFactor = altitude < 2000 ? 3.0 : Math.pow(densityRatio, 0.1);
    
    if (throttle <= abThreshold) {
      // ミリタリーパワーまで（極限効率）
      thrust = (throttle / abThreshold) * maxThrust * f16AltitudeFactor * 2.5;
    } else {
      // アフターバーナー使用（極限効率）
      const abPower = (throttle - abThreshold) / (1 - abThreshold);
      thrust = maxThrust * f16AltitudeFactor * 2.5 + (abPower * (maxThrustAB - maxThrust) * f16AltitudeFactor * 2.0);
    }
    
    // 離陸時は速度制限を緩和
    const machNumber = airspeedKmh / 1225;
    if (machNumber > 1.2) { // より高い速度まで効率維持
      thrust *= Math.max(0.8, 1.3 - machNumber * 0.2);
    }
    
    if (throttle > 0.5 && Math.random() < 0.1) {
      console.log(`F-16 Thrust: ${(thrust/1000).toFixed(0)}kN, Throttle: ${(throttle * 100).toFixed(0)}%, AB: ${throttle > abThreshold ? 'ON' : 'OFF'}`);
    }
  } else {
    // セスナ172の推力計算（2倍速強化）
    const staticThrust = 30000; // N (2倍増加 - 超重力制覇推力)
    const airspeedMs = airspeedKmh / 3.6;
    
    // プロペラ効率の最適化：離陸時の超極限加速
    let propellerEfficiency = 1.0;
    if (airspeedMs <= 30) { // 離陸時の最重要速度域（108km/h以下）
      propellerEfficiency = 4.0; // 300%のボーナス効率
    } else if (airspeedMs <= 50) { // 50m/s (180km/h) まで高効率維持
      propellerEfficiency = 3.5; // 250%のボーナス効率  
    } else if (airspeedMs > 60) { // 60m/s (216km/h) 以上で効率低下開始
      propellerEfficiency = Math.max(1.5, 3.0 - (airspeedMs - 60) / 60);
    }
    
    // 地上では推力を超極限ブースト
    const groundBonus = altitude < 150 ? 3.5 : 1.0;
    thrust = throttle * staticThrust * altitudeFactor * propellerEfficiency * groundBonus;
  }
  
  return forward.multiplyScalar(thrust);
}

// 重力を計算
export function calculateGravity(mass: number): Vector3 {
  return new Vector3(0, -PHYSICS_CONSTANTS.GRAVITY * mass, 0);
}

// 地上での車輪の力を計算
export function calculateGroundForces(
  aircraft: Aircraft,
  velocity: Vector3,
  controls: ControlInputs,
  totalForce: Vector3
): Vector3 {
  if (aircraft.altitude > 1.0 || !aircraft.landingGear) {
    return new Vector3(0, 0, 0);
  }
  
  const groundForce = new Vector3(0, 0, 0);
  
  // 地面反力
  if (aircraft.altitude <= 0.6) {
    // 垂直方向の力（地面からの反力）
    if (totalForce.y < 0) {
      groundForce.y = -totalForce.y; // 重力をキャンセル
    }
    
    // 水平方向の摩擦力
    const horizontalVelocity = new Vector3(velocity.x, 0, velocity.z);
    const speed = horizontalVelocity.length();
    
    if (speed > 0.01) {
      // 転がり抵抗を極限まで削減：超高速離陸を実現
      let rollingResistance;
      if (controls.brakes) {
        rollingResistance = 0.15; // ブレーキ時も大幅削減
      } else {
        rollingResistance = 0.0002; // 離陸時は極微小の抵抗のみ
      }
      
      // 機種別の重量調整
      let normalForce = 6377; // Cessna 172 (650kg * 9.81) - 極限軽量化
      if (aircraft.type === 'boeing737') {
        normalForce = 245250; // Boeing 737 (25000kg * 9.81) - 究極軽量化
      } else if (aircraft.type === 'f16') {
        normalForce = 58860; // F-16 (6000kg * 9.81) - 極限軽量化
      }
      
      const frictionForce = horizontalVelocity.clone().normalize().multiplyScalar(-rollingResistance * normalForce);
      groundForce.add(frictionForce);
    }
  }
  
  return groundForce;
}

// 航空機の物理状態を更新
export function updateAircraftPhysics(
  aircraft: Aircraft,
  controls: ControlInputs,
  weather: WeatherConditions,
  deltaTime: number
): Partial<Aircraft> {
  if (!aircraft || !aircraft.type) {
    logHighError(
      ERROR_CODES.PHYSICS_INVALID_AIRCRAFT,
      'Invalid aircraft object in updateAircraftPhysics',
      { aircraft }
    );
    return {};
  }
  
  // 航空機タイプの検証とフォールバック
  const validatedType = validateAircraftType(aircraft.type);
  const specs = AIRCRAFT_SPECS[validatedType];
  
  if (!specs) {
    logHighError(
      ERROR_CODES.PHYSICS_MISSING_SPECS,
      `No specs found for validated aircraft type: ${validatedType}`,
      { originalType: aircraft.type, validatedType }
    );
    return {};
  }
  
  const airDensity = getAirDensity(aircraft.altitude);
  
  // 現在の向きから各軸ベクトルを取得
  const forward = new Vector3(0, 0, -1).applyEuler(aircraft.rotation);
  const up = new Vector3(0, 1, 0).applyEuler(aircraft.rotation);
  const right = new Vector3(1, 0, 0).applyEuler(aircraft.rotation);
  
  // 機体に対する相対速度を計算（風の影響を含む）
  const windVector = new Vector3(
    Math.sin(weather.windDirection * Math.PI / 180) * weather.windSpeed,
    0,
    Math.cos(weather.windDirection * Math.PI / 180) * weather.windSpeed
  );
  const relativeVelocity = aircraft.velocity.clone().sub(windVector);
  
  // 迎角の計算
  const velocityInPlane = relativeVelocity.clone().projectOnPlane(right);
  const angleOfAttack = Math.atan2(
    velocityInPlane.dot(up),
    -velocityInPlane.dot(forward)
  );
  
  // 各種力を計算
  const lift = calculateLift(relativeVelocity, airDensity, specs.wingArea, specs.liftCoefficient, angleOfAttack, aircraft);
  const drag = calculateDrag(relativeVelocity, airDensity, specs.wingArea, specs.dragCoefficient, aircraft);
  const thrust = calculateThrust(controls.throttle, specs.enginePower, airDensity, aircraft.altitude, forward, aircraft.airspeed, validatedType);
  const gravity = calculateGravity(specs.weight);
  
  // フラップによる揚力と抗力の増加
  const flapFactor = 1 + (aircraft.flaps / 40) * 0.5;
  lift.multiplyScalar(flapFactor);
  drag.multiplyScalar(1 + (aircraft.flaps / 40) * 0.5);
  
  // 合力を計算（地上力を除く）
  const totalForce = new Vector3()
    .add(lift)
    .add(drag)
    .add(thrust)
    .add(gravity);
  
  // 地上力を計算して追加
  const groundForces = calculateGroundForces(aircraft, aircraft.velocity, controls, totalForce);
  totalForce.add(groundForces);
  
  // 加速度を計算 (F = ma)
  const acceleration = totalForce.divideScalar(specs.weight);
  
  // デバッグ情報
  if (aircraft.altitude < 1 && Math.random() < 0.05) {
    console.log(`Forces - Thrust: ${thrust.length().toFixed(0)}N, Drag: ${drag.length().toFixed(0)}N, Acceleration: ${acceleration.length().toFixed(2)}m/s^2`);
  }
  
  // 速度を更新
  const newVelocity = aircraft.velocity.clone().add(
    acceleration.multiplyScalar(deltaTime)
  );
  
  // 地面との衝突処理
  const newPosition = aircraft.position.clone().add(
    newVelocity.clone().multiplyScalar(deltaTime)
  );
  
  // 高度制限（機種別調整）
  let groundLevel = 0.5;
  if (aircraft.type === 'boeing737') {
    groundLevel = 8.0; // Boeing 737の着陸装置高さ
  } else if (aircraft.type === 'f16') {
    groundLevel = 4.0; // F-16の着陸装置高さ
  } else {
    groundLevel = 2.5; // Cessna 172の着陸装置高さ
  }
  
  if (newPosition.y < groundLevel && aircraft.landingGear) {
    newPosition.y = groundLevel;
    // 地上では下向き速度のみキャンセル、上向きは許可
    if (newVelocity.y < 0) {
      newVelocity.y = 0;
    }
  }
  
  // 回転を更新（操縦入力に基づく）
  // 速度に応じて操縦入力の効きを調整
  const baseSpeed = aircraft.type === 'boeing737' ? 200 : 50; // Boeing 737は高速で効果が出始める
  const speedFactor = Math.max(0.1, Math.min(1, aircraft.airspeed / baseSpeed));
  
  // 地上での前輪ステアリング
  const onGround = aircraft.altitude < 1.0 && aircraft.landingGear;
  
  let pitchRate = 0;
  let rollRate = 0;
  let yawRate = 0;
  
  if (onGround) {
    // 地上ではヨーのみ（前輪ステアリング）
    const groundSpeed = aircraft.type === 'boeing737' ? 50 : 30;
    yawRate = controls.yaw * Math.PI / 180 * 30 * Math.min(1, aircraft.airspeed / groundSpeed);
  } else {
    // 空中での操縦
    if (aircraft.type === 'f16') {
      // F-16の高機動性能
      const gLimit = 9; // 最大9G
      const currentG = Math.abs(totalForce.y / (specs.weight * PHYSICS_CONSTANTS.GRAVITY));
      const gFactor = Math.min(1, gLimit / Math.max(1, currentG));
      
      pitchRate = controls.pitch * Math.PI / 180 * 180 * speedFactor * gFactor;
      rollRate = controls.roll * Math.PI / 180 * 270 * speedFactor;
      yawRate = controls.yaw * Math.PI / 180 * 45 * speedFactor;
    } else if (aircraft.type === 'boeing737') {
      // Boeing 737は操縦応答がより緩やか
      pitchRate = controls.pitch * Math.PI / 180 * 20 * speedFactor;
      rollRate = controls.roll * Math.PI / 180 * 40 * speedFactor;
      yawRate = controls.yaw * Math.PI / 180 * 15 * speedFactor;
    } else {
      // セスナ172の操縦応答
      pitchRate = controls.pitch * Math.PI / 180 * 30 * speedFactor;
      rollRate = controls.roll * Math.PI / 180 * 60 * speedFactor;
      yawRate = controls.yaw * Math.PI / 180 * 20 * speedFactor;
    }
  }
  
  const newRotation = new Euler(
    aircraft.rotation.x + pitchRate * deltaTime,
    aircraft.rotation.y + yawRate * deltaTime,
    aircraft.rotation.z + rollRate * deltaTime
  );
  
  // 速度と高度から各種パラメータを計算
  const newAirspeed = relativeVelocity.length() * 3.6; // m/s → km/h
  const newAltitude = Math.max(0.5, newPosition.y);
  const newVerticalSpeed = newVelocity.y;
  
  // エンジンRPMを更新（スロットルに応じて）
  let targetRPM = controls.throttle * 2700; // セスナ172の最大RPM
  if (aircraft.type === 'boeing737') {
    targetRPM = controls.throttle * 100; // Boeing 737のN1%（推力設定）
  }
  const currentRPM = aircraft.engineRPM;
  const rpmChange = (targetRPM - currentRPM) * deltaTime * 3; // 応答速度
  const newEngineRPM = currentRPM + rpmChange;
  
  // 方位の計算
  const newHeading = ((newRotation.y * 180 / Math.PI) % 360 + 360) % 360;
  
  // 燃料消費
  const fuelConsumption = (specs.fuelConsumption / 3600) * controls.throttle * deltaTime;
  const newFuel = Math.max(0, aircraft.fuel - fuelConsumption);
  
  // G力の計算
  const gForce = totalForce.y / (specs.weight * PHYSICS_CONSTANTS.GRAVITY) + 1;
  
  return {
    position: newPosition,
    rotation: newRotation,
    velocity: newVelocity,
    altitude: newAltitude,
    airspeed: newAirspeed,
    verticalSpeed: newVerticalSpeed,
    heading: newHeading,
    engineRPM: newEngineRPM,
    fuel: newFuel,
    throttle: controls.throttle,
    flaps: aircraft.flaps,
    landingGear: controls.landingGear,
    brakes: controls.brakes,
    gForce: gForce,
  };
}

// 失速チェック
export function checkStall(aircraft: Aircraft): boolean {
  if (!aircraft || !aircraft.type) {
    logMediumError(
      ERROR_CODES.PHYSICS_STALL_CHECK_FAILED,
      'Invalid aircraft object in checkStall',
      { aircraft }
    );
    return false;
  }
  
  const validatedType = validateAircraftType(aircraft.type);
  const specs = AIRCRAFT_SPECS[validatedType];
  if (!specs) {
    logMediumError(
      ERROR_CODES.PHYSICS_MISSING_SPECS,
      `No specs found for validated aircraft type in checkStall: ${validatedType}`,
      { originalType: aircraft.type, validatedType }
    );
    return false;
  }
  
  // フラップを考慮した失速速度
  const flapFactor = 1 - (aircraft.flaps / 40) * 0.2; // フラップで失速速度20%減
  const adjustedStallSpeed = specs.stallSpeed * flapFactor;
  
  return aircraft.airspeed < adjustedStallSpeed;
}

// 地面衝突チェック
export function checkGroundCollision(aircraft: Aircraft, groundLevel: number = 0): boolean {
  return aircraft.position.y <= groundLevel;
}

// オートパイロット（簡易版）
export function calculateAutopilotControls(
  aircraft: Aircraft,
  targetAltitude: number,
  targetHeading: number
): Partial<ControlInputs> {
  if (!aircraft || !aircraft.type) {
    logMediumError(
      ERROR_CODES.PHYSICS_AUTOPILOT_FAILED,
      'Invalid aircraft object in calculateAutopilotControls',
      { aircraft }
    );
    return {};
  }
  
  const validatedType = validateAircraftType(aircraft.type);
  const specs = AIRCRAFT_SPECS[validatedType];
  if (!specs) {
    logMediumError(
      ERROR_CODES.PHYSICS_MISSING_SPECS,
      `No specs found for validated aircraft type in calculateAutopilotControls: ${validatedType}`,
      { originalType: aircraft.type, validatedType }
    );
    return {};
  }
  
  const altitudeError = targetAltitude - aircraft.altitude;
  const headingError = targetHeading - aircraft.heading;
  
  // 高度制御
  const pitch = Math.max(-1, Math.min(1, altitudeError * 0.001));
  
  // 方位制御
  const yaw = Math.max(-1, Math.min(1, headingError * 0.01));
  
  // 速度制御（巡航速度を維持）
  const speedError = specs.cruiseSpeed - aircraft.airspeed;
  const throttle = Math.max(0, Math.min(1, 0.7 + speedError * 0.001));
  
  return { pitch, yaw, throttle };
}

// 着陸支援システム
export function calculateILSGuidance(
  aircraft: Aircraft,
  runwayPosition: Vector3,
  runwayHeading: number,
  glideSlopeAngle: number = 3 // 度
): {
  localizerDeviation: number; // 左右のずれ（度）
  glideSlopeDeviation: number; // 上下のずれ（度）
  distance: number; // 滑走路までの距離
} {
  // 滑走路への相対位置
  const relativePosition = aircraft.position.clone().sub(runwayPosition);
  const distance = relativePosition.length();
  
  // ローカライザー（左右のずれ）
  const runwayDirection = new Vector3(
    Math.sin(runwayHeading * Math.PI / 180),
    0,
    -Math.cos(runwayHeading * Math.PI / 180)
  );
  const crossTrackError = relativePosition.clone().cross(runwayDirection).y;
  const localizerDeviation = Math.atan2(crossTrackError, distance) * 180 / Math.PI;
  
  // グライドスロープ（上下のずれ）
  const idealAltitude = distance * Math.tan(glideSlopeAngle * Math.PI / 180);
  const altitudeError = aircraft.altitude - idealAltitude;
  const glideSlopeDeviation = Math.atan2(altitudeError, distance) * 180 / Math.PI;
  
  return {
    localizerDeviation,
    glideSlopeDeviation,
    distance,
  };
}
