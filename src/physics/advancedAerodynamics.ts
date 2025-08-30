/**
 * 高度な空力計算システム
 * 失速・スピンモデル、後流効果、地面効果、圧縮性効果
 */

import * as THREE from 'three';
import { Vector3, Euler } from 'three';
import { Aircraft, ControlInputs, WeatherConditions } from '@/types';
import { AIRCRAFT_SPECS, PHYSICS_CONSTANTS } from '@/constants';
import { audioSystem } from '@/systems/AudioSystem';

export interface AdvancedAerodynamicState {
  stallState: 'clean' | 'approaching' | 'stalled' | 'deep_stall' | 'spin';
  spinType: 'none' | 'incipient' | 'developed' | 'flat';
  groundEffect: number; // 0-1, 1が最大効果
  compressibilityFactor: number;
  wakeStrength: number;
  turbulenceLevel: number;
  gLoading: number;
  stallWarning: boolean;
  spinRecovery: {
    required: boolean;
    technique: string;
    power: number;
    controls: ControlInputs;
  };
}

export class AdvancedAerodynamics {
  private previousState: Map<string, AdvancedAerodynamicState> = new Map();
  private stallHistory: number[] = [];
  private spinRecoveryTimer: number = 0;
  
  /**
   * 高度な空力計算メイン関数
   */
  calculateAdvancedAerodynamics(
    aircraft: Aircraft,
    controls: ControlInputs,
    weather: WeatherConditions,
    deltaTime: number
  ): {
    forces: Vector3;
    moments: Vector3;
    state: AdvancedAerodynamicState;
    warnings: string[];
  } {
    const state = this.calculateAerodynamicState(aircraft, controls, weather, deltaTime);
    const forces = this.calculateAdvancedForces(aircraft, controls, state);
    const moments = this.calculateAdvancedMoments(aircraft, controls, state);
    const warnings = this.generateWarnings(state, aircraft);
    
    // 状態履歴を更新
    this.previousState.set(aircraft.id, state);
    
    return { forces, moments, state, warnings };
  }
  
  /**
   * 空力状態の計算
   */
  private calculateAerodynamicState(
    aircraft: Aircraft,
    controls: ControlInputs,
    weather: WeatherConditions,
    deltaTime: number
  ): AdvancedAerodynamicState {
    const speed = aircraft.velocity.length();
    const altitude = aircraft.altitude;
    const angleOfAttack = this.calculateAngleOfAttack(aircraft);
    const sideslipAngle = this.calculateSideslipAngle(aircraft);
    
    // 失速状態の判定
    const stallState = this.calculateStallState(aircraft, angleOfAttack, speed, controls);
    
    // スピン状態の判定
    const spinType = this.calculateSpinState(aircraft, stallState, sideslipAngle, controls);
    
    // 地面効果
    const groundEffect = this.calculateGroundEffect(aircraft);
    
    // 圧縮性効果（高速飛行時）
    const compressibilityFactor = this.calculateCompressibilityEffect(aircraft, speed, altitude);
    
    // 後流強度
    const wakeStrength = this.calculateWakeStrength(aircraft, weather);
    
    // 乱気流レベル
    const turbulenceLevel = this.calculateTurbulence(aircraft, weather);
    
    // G負荷
    const gLoading = this.calculateGLoading(aircraft, deltaTime);
    
    // 失速警報
    const stallWarning = this.shouldTriggerStallWarning(stallState, speed, aircraft.type);
    
    // スピン回復
    const spinRecovery = this.calculateSpinRecovery(aircraft, stallState, spinType, controls);
    
    return {
      stallState,
      spinType,
      groundEffect,
      compressibilityFactor,
      wakeStrength,
      turbulenceLevel,
      gLoading,
      stallWarning,
      spinRecovery
    };
  }
  
  /**
   * 失速状態の計算
   */
  private calculateStallState(
    aircraft: Aircraft,
    angleOfAttack: number,
    speed: number,
    controls: ControlInputs
  ): AdvancedAerodynamicState['stallState'] {
    const specs = AIRCRAFT_SPECS[aircraft.type];
    let stallSpeed = specs.stallSpeed / 3.6; // km/h -> m/s
    
    // 速度ベースの判定
    const speedStallFactor = speed / stallSpeed;
    
    // 迎角ベースの判定（航空機タイプ別）
    let criticalAoA: number;
    let deepStallAoA: number;
    
    switch (aircraft.type) {
      case 'f16':
        criticalAoA = 0.35; // 20度
        deepStallAoA = 0.52; // 30度
        break;
      case 'boeing737':
        criticalAoA = 0.25; // 14度
        deepStallAoA = 0.35; // 20度
        break;
      default: // cessna172
        criticalAoA = 0.30; // 17度
        deepStallAoA = 0.42; // 24度
        break;
    }
    
    // フラップ効果
    if (aircraft.flaps > 0) {
      criticalAoA += aircraft.flaps / 40 * 0.1; // フラップ展開でストール迎角向上
      stallSpeed *= (1 - aircraft.flaps / 40 * 0.3); // フラップ展開でストール速度低下
    }
    
    // G負荷による影響
    const gFactor = Math.sqrt(Math.abs(aircraft.gForce));
    const effectiveStallSpeed = stallSpeed * gFactor;
    
    if (angleOfAttack > deepStallAoA || (speedStallFactor < 0.7 && angleOfAttack > criticalAoA * 0.8)) {
      return 'deep_stall';
    } else if (angleOfAttack > criticalAoA || speedStallFactor < 0.8) {
      return 'stalled';
    } else if (angleOfAttack > criticalAoA * 0.8 || speedStallFactor < 1.1) {
      return 'approaching';
    } else {
      return 'clean';
    }
  }
  
  /**
   * スピン状態の計算
   */
  private calculateSpinState(
    aircraft: Aircraft,
    stallState: AdvancedAerodynamicState['stallState'],
    sideslipAngle: number,
    controls: ControlInputs
  ): AdvancedAerodynamicState['spinType'] {
    if (stallState !== 'stalled' && stallState !== 'deep_stall') {
      return 'none';
    }
    
    const yawRate = Math.abs(aircraft.velocity.y); // 簡略化されたヨー率
    const rollRate = Math.abs(controls.roll);
    
    // スピンの判定
    if (yawRate > 0.5 && rollRate > 0.3 && Math.abs(sideslipAngle) > 0.2) {
      if (stallState === 'deep_stall' && yawRate > 1.0) {
        return 'flat';
      } else if (yawRate > 0.8) {
        return 'developed';
      } else {
        return 'incipient';
      }
    }
    
    return 'none';
  }
  
  /**
   * 地面効果の計算
   */
  private calculateGroundEffect(aircraft: Aircraft): number {
    const specs = AIRCRAFT_SPECS[aircraft.type];
    const wingspan = Math.sqrt(specs.wingArea) * 2; // 翼面積から概算
    const heightAboveGround = Math.max(0, aircraft.altitude);
    
    if (heightAboveGround > wingspan * 2) {
      return 0; // 地面効果なし
    }
    
    // 地面効果は高度/翼幅比で決まる
    const heightToSpanRatio = heightAboveGround / wingspan;
    
    if (heightToSpanRatio <= 0.1) {
      return 1.0; // 最大地面効果
    } else if (heightToSpanRatio <= 1.0) {
      return 1.0 - heightToSpanRatio; // 線形減少
    } else {
      return Math.max(0, 0.5 - (heightToSpanRatio - 1.0) * 0.5); // さらに減少
    }
  }
  
  /**
   * 圧縮性効果の計算（高速飛行時）
   */
  private calculateCompressibilityEffect(aircraft: Aircraft, speed: number, altitude: number): number {
    const soundSpeed = this.getSoundSpeed(altitude);
    const mach = speed / soundSpeed;
    
    if (mach < 0.3) {
      return 1.0; // 圧縮性効果なし
    } else if (mach < 0.7) {
      // 亜音速での軽微な効果
      return 1.0 + (mach - 0.3) * 0.1;
    } else if (mach < 1.0) {
      // 遷音速での大きな変化
      const factor = (mach - 0.7) / 0.3;
      return 1.04 + factor * 0.3; // 抗力急増
    } else {
      // 超音速
      return 1.5 + (mach - 1.0) * 0.2;
    }
  }
  
  /**
   * 音速の計算
   */
  private getSoundSpeed(altitude: number): number {
    const temperature = 288.15 - altitude * 0.0065; // 標準大気
    return Math.sqrt(1.4 * 287 * temperature); // m/s
  }
  
  /**
   * 後流強度の計算
   */
  private calculateWakeStrength(aircraft: Aircraft, weather: WeatherConditions): number {
    const speed = aircraft.velocity.length();
    const baseWake = speed * 0.01; // 基本後流強度
    
    // 風による影響
    const windEffect = weather.windSpeed / 50; // 風速による希釈効果
    
    return Math.max(0, baseWake - windEffect);
  }
  
  /**
   * 乱気流の計算
   */
  private calculateTurbulence(aircraft: Aircraft, weather: WeatherConditions): number {
    let turbulence = weather.turbulence;
    
    // 高度による影響
    if (aircraft.altitude < 1000) {
      turbulence += 0.2; // 低高度では地形乱気流
    } else if (aircraft.altitude > 10000) {
      turbulence += 0.1; // 高高度でのジェット気流
    }
    
    // 速度による影響
    const speed = aircraft.velocity.length();
    if (speed > 200) {
      turbulence += (speed - 200) * 0.001;
    }
    
    return Math.min(1.0, turbulence);
  }
  
  /**
   * G負荷の計算
   */
  private calculateGLoading(aircraft: Aircraft, deltaTime: number): number {
    // 加速度から G 負荷を計算
    const acceleration = new Vector3().copy(aircraft.velocity).multiplyScalar(1 / deltaTime);
    const verticalAccel = acceleration.y;
    return 1.0 + verticalAccel / 9.81; // 1G基準
  }
  
  /**
   * 迎角の計算
   */
  private calculateAngleOfAttack(aircraft: Aircraft): number {
    const velocity = aircraft.velocity.normalize();
    const forward = new Vector3(0, 0, -1).applyEuler(aircraft.rotation);
    return Math.acos(velocity.dot(forward));
  }
  
  /**
   * 横滑り角の計算
   */
  private calculateSideslipAngle(aircraft: Aircraft): number {
    const velocity = aircraft.velocity.normalize();
    const right = new Vector3(1, 0, 0).applyEuler(aircraft.rotation);
    return Math.asin(velocity.dot(right));
  }
  
  /**
   * 失速警告の判定
   */
  private shouldTriggerStallWarning(
    stallState: AdvancedAerodynamicState['stallState'],
    speed: number,
    aircraftType: string
  ): boolean {
    return stallState === 'approaching' || stallState === 'stalled';
  }
  
  /**
   * スピン回復の計算
   */
  private calculateSpinRecovery(
    aircraft: Aircraft,
    stallState: AdvancedAerodynamicState['stallState'],
    spinType: AdvancedAerodynamicState['spinType'],
    controls: ControlInputs
  ): AdvancedAerodynamicState['spinRecovery'] {
    if (spinType === 'none') {
      return {
        required: false,
        technique: 'normal',
        power: controls.throttle,
        controls
      };
    }
    
    // スピン回復手順
    let technique = '';
    let requiredPower = 0;
    let requiredControls: ControlInputs = { ...controls };
    
    switch (spinType) {
      case 'incipient':
        technique = 'Reduce power, opposite rudder, forward stick';
        requiredPower = 0.1;
        requiredControls.throttle = 0.1;
        requiredControls.yaw = -Math.sign(controls.yaw) * 0.8;
        requiredControls.pitch = -0.5;
        break;
      
      case 'developed':
        technique = 'POWER IDLE, full opposite rudder, stick forward';
        requiredPower = 0;
        requiredControls.throttle = 0;
        requiredControls.yaw = -Math.sign(controls.yaw) * 1.0;
        requiredControls.pitch = -0.8;
        break;
      
      case 'flat':
        technique = 'Emergency procedure: Full forward stick, opposite rudder, may require parachute';
        requiredPower = 0;
        requiredControls.throttle = 0;
        requiredControls.yaw = -Math.sign(controls.yaw) * 1.0;
        requiredControls.pitch = -1.0;
        break;
    }
    
    return {
      required: true,
      technique,
      power: requiredPower,
      controls: requiredControls
    };
  }
  
  /**
   * 高度な力の計算
   */
  private calculateAdvancedForces(
    aircraft: Aircraft,
    controls: ControlInputs,
    state: AdvancedAerodynamicState
  ): Vector3 {
    const specs = AIRCRAFT_SPECS[aircraft.type];
    const speed = aircraft.velocity.length();
    const force = new Vector3();
    
    // 基本揚力・抗力
    const basicLift = this.calculateBasicLift(aircraft, state);
    const basicDrag = this.calculateBasicDrag(aircraft, state);
    
    // 地面効果による揚力増加・抗力減少
    if (state.groundEffect > 0) {
      basicLift.multiplyScalar(1 + state.groundEffect * 0.4);
      basicDrag.multiplyScalar(1 - state.groundEffect * 0.2);
    }
    
    // 圧縮性効果
    basicDrag.multiplyScalar(state.compressibilityFactor);
    
    // 失速時の特殊効果
    if (state.stallState === 'stalled' || state.stallState === 'deep_stall') {
      basicLift.multiplyScalar(0.3 + Math.random() * 0.4); // 不安定な揚力
      basicDrag.multiplyScalar(2.0); // 大幅な抗力増加
    }
    
    // 乱気流による変動
    if (state.turbulenceLevel > 0) {
      const turbulentForce = new Vector3(
        (Math.random() - 0.5) * state.turbulenceLevel * 1000,
        (Math.random() - 0.5) * state.turbulenceLevel * 1000,
        (Math.random() - 0.5) * state.turbulenceLevel * 500
      );
      force.add(turbulentForce);
    }
    
    force.add(basicLift).add(basicDrag);
    return force;
  }
  
  /**
   * 高度なモーメントの計算
   */
  private calculateAdvancedMoments(
    aircraft: Aircraft,
    controls: ControlInputs,
    state: AdvancedAerodynamicState
  ): Vector3 {
    const moment = new Vector3();
    
    // 基本的なモーメント
    const pitchMoment = controls.pitch * 50000;
    const rollMoment = controls.roll * 30000;
    const yawMoment = controls.yaw * 20000;
    
    // 失速時の制御性低下
    if (state.stallState === 'stalled' || state.stallState === 'deep_stall') {
      const effectiveness = state.stallState === 'deep_stall' ? 0.1 : 0.3;
      moment.set(
        rollMoment * effectiveness,
        pitchMoment * effectiveness,
        yawMoment * effectiveness
      );
    } else {
      moment.set(rollMoment, pitchMoment, yawMoment);
    }
    
    // スピン時の特殊モーメント
    if (state.spinType !== 'none') {
      const spinMoment = state.spinType === 'flat' ? 10000 : 5000;
      moment.add(new Vector3(
        Math.sin(Date.now() * 0.01) * spinMoment,
        0,
        Math.cos(Date.now() * 0.01) * spinMoment
      ));
    }
    
    return moment;
  }
  
  /**
   * 基本揚力の計算
   */
  private calculateBasicLift(aircraft: Aircraft, state: AdvancedAerodynamicState): Vector3 {
    const specs = AIRCRAFT_SPECS[aircraft.type];
    const speed = aircraft.velocity.length();
    const lift = speed * speed * 0.1 * specs.liftCoefficient;
    
    return new Vector3(0, lift, 0);
  }
  
  /**
   * 基本抗力の計算
   */
  private calculateBasicDrag(aircraft: Aircraft, state: AdvancedAerodynamicState): Vector3 {
    const specs = AIRCRAFT_SPECS[aircraft.type];
    const speed = aircraft.velocity.length();
    const drag = speed * speed * 0.05 * specs.dragCoefficient;
    
    const dragDirection = aircraft.velocity.clone().normalize().multiplyScalar(-drag);
    return dragDirection;
  }
  
  /**
   * 警告の生成
   */
  private generateWarnings(state: AdvancedAerodynamicState, aircraft: Aircraft): string[] {
    const warnings: string[] = [];
    
    if (state.stallWarning) {
      warnings.push('STALL WARNING');
    }
    
    if (state.stallState === 'stalled') {
      warnings.push('STALL! Lower nose, add power!');
    }
    
    if (state.stallState === 'deep_stall') {
      warnings.push('DEEP STALL! Emergency recovery required!');
    }
    
    if (state.spinType !== 'none') {
      warnings.push(`SPIN DETECTED: ${state.spinRecovery.technique}`);
    }
    
    if (state.gLoading > 6) {
      warnings.push('HIGH G-FORCE WARNING');
    }
    
    if (state.compressibilityFactor > 1.3) {
      warnings.push('COMPRESSIBILITY EFFECTS');
    }
    
    return warnings;
  }
}

// シングルトンインスタンス
export const advancedAerodynamics = new AdvancedAerodynamics();