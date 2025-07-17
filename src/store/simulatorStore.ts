'use client';

import { create } from 'zustand';
import { Vector3, Euler } from 'three';
import {
  Aircraft,
  AircraftType,
  ControlInputs,
  WeatherConditions,
  CameraView,
  GameSettings,
  HUDSettings,
} from '@/types';
import { AIRCRAFT_SPECS, INITIAL_POSITIONS } from '@/constants';

interface SimulatorState {
  // 航空機の状態
  aircraft: Aircraft;
  setAircraft: (aircraft: Partial<Aircraft>) => void;
  resetAircraft: (type: AircraftType) => void;
  
  // コントロール入力
  controls: ControlInputs;
  setControls: (controls: Partial<ControlInputs>) => void;
  
  // 気象条件
  weather: WeatherConditions;
  setWeather: (weather: Partial<WeatherConditions>) => void;
  
  // カメラビュー
  cameraView: CameraView;
  setCameraView: (view: CameraView) => void;
  
  // ゲーム状態
  isPaused: boolean;
  setPaused: (paused: boolean) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // 設定
  gameSettings: GameSettings;
  setGameSettings: (settings: Partial<GameSettings>) => void;
  hudSettings: HUDSettings;
  setHUDSettings: (settings: Partial<HUDSettings>) => void;
  
  // シミュレーション時間
  simulationTime: number;
  deltaTime: number;
  updateSimulationTime: (delta: number) => void;
}

// デフォルトの航空機状態を作成
const createDefaultAircraft = (type: AircraftType): Aircraft => {
  const specs = AIRCRAFT_SPECS[type];
  const initialPos = INITIAL_POSITIONS.HANEDA_RUNWAY_34R;
  
  // Boeing 737の場合は高さを調整（着陸装置を考慮）
  const yPosition = type === 'boeing737' ? 10.0 : initialPos.position.y;
  const altitude = type === 'boeing737' ? 10.0 : initialPos.altitude;
  
  return {
    id: `aircraft-${Date.now()}`,
    type,
    position: new Vector3(initialPos.position.x, yPosition, initialPos.position.z),
    rotation: new Euler(initialPos.rotation.x, initialPos.rotation.y, initialPos.rotation.z),
    velocity: new Vector3(0, 0, 0),
    fuel: specs.fuelCapacity,
    damage: 0,
    engineRPM: 0,
    throttle: 0,
    altitude: altitude,
    airspeed: 0,
    verticalSpeed: 0,
    heading: 340, // 滑走路の方向
    flaps: 0,
    landingGear: true,
    brakes: true, // 初期状態でブレーキをONに
    gForce: 1, // 初期状態で1G
  };
};

// デフォルトのコントロール入力
const defaultControls: ControlInputs = {
  pitch: 0,
  roll: 0,
  yaw: 0,
  throttle: 0,
  flaps: 0,
  landingGear: true,
  brakes: true, // 初期状態でブレーキをONに
  autopilot: false,
};

// デフォルトの気象条件
const defaultWeather: WeatherConditions = {
  windDirection: 0,
  windSpeed: 0,
  visibility: 10,
  cloudCover: 0.3,
  precipitation: 'none',
  turbulence: 0,
  temperature: 15,
  pressure: 1013,
};

// デフォルトのゲーム設定
const defaultGameSettings: GameSettings = {
  difficulty: 'normal',
  graphics: 'high',
  sound: 80,
  music: 50,
  controls: {
    invertY: false,
    sensitivity: 50,
    deadzone: 10,
  },
  assists: {
    autopilot: true,
    landingGuide: true,
    stallWarning: true,
    collisionWarning: true,
  },
};

// デフォルトのHUD設定
const defaultHUDSettings: HUDSettings = {
  showAltitude: true,
  showAirspeed: true,
  showHeading: true,
  showVerticalSpeed: true,
  showFuel: true,
  showMap: true,
};

// Zustandストア
export const useSimulatorStore = create<SimulatorState>((set) => ({
  // 航空機の状態
  aircraft: createDefaultAircraft('cessna172'),
  setAircraft: (aircraft) =>
    set((state) => ({ aircraft: { ...state.aircraft, ...aircraft } })),
  resetAircraft: (type) =>
    set({ aircraft: createDefaultAircraft(type) }),
  
  // コントロール入力
  controls: defaultControls,
  setControls: (controls) =>
    set((state) => ({ controls: { ...state.controls, ...controls } })),
  
  // 気象条件
  weather: defaultWeather,
  setWeather: (weather) =>
    set((state) => ({ weather: { ...state.weather, ...weather } })),
  
  // カメラビュー
  cameraView: 'external',
  setCameraView: (cameraView) => set({ cameraView }),
  
  // ゲーム状態
  isPaused: false,
  setPaused: (isPaused) => set({ isPaused }),
  isLoading: true,
  setLoading: (isLoading) => set({ isLoading }),
  
  // 設定
  gameSettings: defaultGameSettings,
  setGameSettings: (settings) =>
    set((state) => ({ gameSettings: { ...state.gameSettings, ...settings } })),
  hudSettings: defaultHUDSettings,
  setHUDSettings: (settings) =>
    set((state) => ({ hudSettings: { ...state.hudSettings, ...settings } })),
  
  // シミュレーション時間
  simulationTime: 0,
  deltaTime: 0,
  updateSimulationTime: (delta) =>
    set((state) => ({
      simulationTime: state.simulationTime + delta,
      deltaTime: delta,
    })),
}));
