import { Vector3, Euler } from 'three';

// 航空機の種類
export type AircraftType = 'cessna172' | 'boeing737' | 'f16';

// 航空機の基本データ
export interface Aircraft {
  id: string;
  type: AircraftType;
  position: Vector3;
  rotation: Euler;
  velocity: Vector3;
  fuel: number;
  damage: number;
  engineRPM: number;
  throttle: number;
  altitude: number;
  airspeed: number;
  verticalSpeed: number;
  heading: number;
  flaps: number; // 0-40度
  landingGear: boolean;
  brakes: boolean;
  gForce: number; // 現在のG力
}

// 航空機の性能パラメータ
export interface AircraftSpecs {
  maxSpeed: number; // km/h
  stallSpeed: number; // km/h
  cruiseSpeed: number; // km/h
  maxAltitude: number; // m
  climbRate: number; // m/s
  weight: number; // kg
  fuelCapacity: number; // リットル
  fuelConsumption: number; // リットル/時
  enginePower: number; // 馬力
  wingArea: number; // m²
  dragCoefficient: number;
  liftCoefficient: number;
}

// コントロール入力
export interface ControlInputs {
  pitch: number; // -1 to 1
  roll: number; // -1 to 1
  yaw: number; // -1 to 1
  throttle: number; // 0 to 1
  flaps: number; // 0 to 40
  landingGear: boolean;
  brakes: boolean;
  autopilot: boolean;
}

// 気象条件
export interface WeatherConditions {
  windDirection: number; // 度
  windSpeed: number; // m/s
  visibility: number; // km
  cloudCover: number; // 0-1
  precipitation: 'none' | 'rain' | 'snow';
  turbulence: number; // 0-1
  temperature: number; // ℃
  pressure: number; // hPa
}

// 空港データ
export interface Airport {
  id: string;
  name: string;
  icaoCode: string;
  position: Vector3;
  elevation: number; // m
  runways: Runway[];
}

// 滑走路データ
export interface Runway {
  id: string;
  heading: number;
  length: number; // m
  width: number; // m
  position: Vector3;
  hasILS: boolean;
}

// フライトセッション
export interface FlightSession {
  id: string;
  userId: string;
  aircraftId: string;
  startTime: Date;
  endTime?: Date;
  route: Waypoint[];
  telemetry: TelemetryData[];
  score?: number;
}

// ウェイポイント
export interface Waypoint {
  id: string;
  name: string;
  position: Vector3;
  altitude: number;
  type: 'airport' | 'vor' | 'waypoint' | 'user';
}

// テレメトリーデータ
export interface TelemetryData {
  timestamp: number;
  position: Vector3;
  rotation: Euler;
  altitude: number;
  airspeed: number;
  verticalSpeed: number;
  heading: number;
  throttle: number;
  fuel: number;
}

// カメラビュータイプ
export type CameraView = 'cockpit' | 'external' | 'tower' | 'free';

// HUDの表示設定
export interface HUDSettings {
  showAltitude: boolean;
  showAirspeed: boolean;
  showHeading: boolean;
  showVerticalSpeed: boolean;
  showFuel: boolean;
  showMap: boolean;
}

// ゲーム設定
export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard' | 'realistic';
  graphics: 'low' | 'medium' | 'high' | 'ultra';
  sound: number; // 0-100
  music: number; // 0-100
  controls: {
    invertY: boolean;
    sensitivity: number; // 0-100
    deadzone: number; // 0-100
  };
  assists: {
    autopilot: boolean;
    landingGuide: boolean;
    stallWarning: boolean;
    collisionWarning: boolean;
  };
}
