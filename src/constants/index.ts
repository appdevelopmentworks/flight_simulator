import { AircraftSpecs, AircraftType } from '@/types';

// 航空機の性能仕様
export const AIRCRAFT_SPECS: Record<AircraftType, AircraftSpecs> = {
  cessna172: {
    maxSpeed: 302, // km/h
    stallSpeed: 87, // km/h
    cruiseSpeed: 226, // km/h
    maxAltitude: 4100, // m
    climbRate: 3.66, // m/s
    weight: 650, // kg (極限軽量化：32%減量)
    fuelCapacity: 212, // リットル
    fuelConsumption: 32, // リットル/時
    enginePower: 180, // 馬力
    wingArea: 16.2, // m²
    dragCoefficient: 0.020, // 抗力大幅削減
    liftCoefficient: 2.0, // 揚力大幅向上
  },
  boeing737: {
    maxSpeed: 876, // km/h
    stallSpeed: 250, // km/h
    cruiseSpeed: 850, // km/h
    maxAltitude: 12500, // m
    climbRate: 15, // m/s
    weight: 25000, // kg (究極軽量化：65%減量)
    fuelCapacity: 26000, // リットル
    fuelConsumption: 2600, // リットル/時
    enginePower: 50000, // 推力 (N)
    wingArea: 125, // m²
    dragCoefficient: 0.010, // 抗力究極削減
    liftCoefficient: 3.0, // 揚力究極向上
  },
  f16: {
    maxSpeed: 2120, // km/h
    stallSpeed: 204, // km/h
    cruiseSpeed: 1320, // km/h
    maxAltitude: 18000, // m
    climbRate: 254, // m/s
    weight: 6000, // kg (極限軽量化：50%減量)
    fuelCapacity: 3200, // リットル
    fuelConsumption: 1500, // リットル/時
    enginePower: 130000, // 推力 (N)
    wingArea: 27.9, // m²
    dragCoefficient: 0.010, // 抗力極限削減
    liftCoefficient: 1.8, // 揚力大幅向上
  },
};

// 物理定数
export const PHYSICS_CONSTANTS = {
  GRAVITY: 9.81, // m/s²
  AIR_DENSITY_SEA_LEVEL: 1.225, // kg/m³
  TEMPERATURE_LAPSE_RATE: -0.0065, // K/m
  SEA_LEVEL_TEMPERATURE: 288.15, // K
  SEA_LEVEL_PRESSURE: 101325, // Pa
  GAS_CONSTANT: 287.05, // J/(kg·K)
};

// コントロール設定
export const CONTROL_SETTINGS = {
  PITCH_RATE: 50, // 度/秒
  ROLL_RATE: 120, // 度/秒
  YAW_RATE: 30, // 度/秒
  THROTTLE_RESPONSE: 2, // 秒 (0から100%まで)
  FLAP_DEPLOY_SPEED: 5, // 度/秒
  GEAR_DEPLOY_TIME: 5, // 秒
};

// キーボードマッピング
export const KEYBOARD_CONTROLS = {
  // 基本操作
  PITCH_UP: 'ArrowDown',
  PITCH_DOWN: 'ArrowUp',
  ROLL_LEFT: 'ArrowLeft',
  ROLL_RIGHT: 'ArrowRight',
  YAW_LEFT: 'a',
  YAW_RIGHT: 'd',
  
  // エンジン
  THROTTLE_UP: 'w',
  THROTTLE_DOWN: 's',
  THROTTLE_IDLE: 'x',
  THROTTLE_FULL: 'z',
  
  // システム
  FLAPS_UP: 'f',
  FLAPS_DOWN: 'g',
  LANDING_GEAR: 'l',
  BRAKES: 'b',
  AUTOPILOT: 'p',
  
  // カメラ
  CAMERA_COCKPIT: '1',
  CAMERA_EXTERNAL: '2',
  CAMERA_TOWER: '3',
  CAMERA_FREE: '4',
  
  // その他
  PAUSE: 'Escape',
  MAP: 'm',
  HELP: 'h',
};

// 初期位置設定（羽田空港滑走路）
export const INITIAL_POSITIONS = {
  HANEDA_RUNWAY_34R: {
    position: { x: 0, y: 2.5, z: 0 }, // 滑走路上に配置（デフォルト高度）
    rotation: { x: 0, y: Math.PI * 1.89, z: 0 }, // 340度方向
    altitude: 2.5, // 滑走路上の高度 (m)
  },
};

// UI設定
export const UI_CONSTANTS = {
  HUD_OPACITY: 0.8,
  INSTRUMENT_UPDATE_RATE: 60, // Hz
  MAP_UPDATE_RATE: 10, // Hz
  WARNING_THRESHOLD: {
    LOW_FUEL: 20, // %
    STALL_MARGIN: 1.2, // 失速速度の倍率
    LOW_ALTITUDE: 100, // m
    HIGH_VERTICAL_SPEED: 10, // m/s
  },
};

// グラフィック設定プリセット
export const GRAPHICS_PRESETS = {
  low: {
    shadowMapSize: 512,
    antialias: false,
    pixelRatio: 0.75,
    drawDistance: 5000,
    terrainLOD: 2,
  },
  medium: {
    shadowMapSize: 1024,
    antialias: true,
    pixelRatio: 1,
    drawDistance: 10000,
    terrainLOD: 1,
  },
  high: {
    shadowMapSize: 2048,
    antialias: true,
    pixelRatio: 1,
    drawDistance: 20000,
    terrainLOD: 0,
  },
  ultra: {
    shadowMapSize: 4096,
    antialias: true,
    pixelRatio: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
    drawDistance: 50000,
    terrainLOD: 0,
  },
};
