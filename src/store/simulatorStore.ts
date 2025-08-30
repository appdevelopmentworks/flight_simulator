'use client';

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
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
import { storageManager, UserProfile, FlightRecord } from '@/utils/storageManager';
import { performanceMonitor } from '@/utils/performance';
import { weatherSystem } from '@/systems/WeatherSystem';

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
  
  // プロフィール管理
  currentProfile: UserProfile | null;
  setCurrentProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  
  // フライト記録
  currentFlightRecord: FlightRecord | null;
  startFlightRecording: () => void;
  stopFlightRecording: (landingScore?: number, crashed?: boolean) => void;
  updateFlightTelemetry: () => void;
  
  // 設定の永続化
  loadSettings: () => void;
  saveSettings: () => void;
  resetToDefaults: () => void;
  
  // 天候システム
  updateWeatherFromSystem: () => void;
  getWeatherAtPosition: (position: Vector3) => WeatherConditions;
  getWeatherForecast: (hoursAhead: number) => any[];
  createWeatherSystem: (center: Vector3, type: string, intensity: number) => void;
  
  // プロフィールの永続化
  loadProfile: (profileId: string) => Promise<boolean>;
  saveProfile: () => Promise<boolean>;
  createNewProfile: (name: string) => Promise<UserProfile>;
  deleteProfile: (profileId: string) => Promise<boolean>;
  getAllProfiles: () => UserProfile[];
}

// デフォルトの航空機状態を作成
const createDefaultAircraft = (type: AircraftType): Aircraft => {
  const specs = AIRCRAFT_SPECS[type];
  const initialPos = INITIAL_POSITIONS.HANEDA_RUNWAY_34R;
  
  // 機体タイプに応じた高さ調整（滑走路上に着陸装置を考慮して配置）
  let yPosition, altitude;
  
  switch (type) {
    case 'cessna172':
      yPosition = 2.5;  // セスナの着陸装置高さ
      altitude = 2.5;
      break;
    case 'boeing737':
      yPosition = 8.0;  // ボーイング737の着陸装置高さ
      altitude = 8.0;
      break;
    case 'f16':
      yPosition = 4.0;  // F-16の着陸装置高さ
      altitude = 4.0;
      break;
    default:
      yPosition = 2.5;
      altitude = 2.5;
  }
  
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

// フライト記録用のテレメトリ作成ヘルパー
const createTelemetryPoint = (aircraft: Aircraft, timestamp: number, startTime: number) => ({
  t: timestamp - startTime,
  p: [aircraft.position.x, aircraft.position.y, aircraft.position.z] as [number, number, number],
  r: [aircraft.rotation.x, aircraft.rotation.y, aircraft.rotation.z] as [number, number, number],
  v: aircraft.airspeed,
  a: aircraft.altitude,
  th: aircraft.throttle,
  f: aircraft.fuel
});

// 初期化時に設定を読み込む関数（SSR対応）
const initializeStore = () => {
  // サーバーサイドの場合はデフォルト値を返す
  if (typeof window === 'undefined') {
    return {
      gameSettings: defaultGameSettings,
      hudSettings: defaultHUDSettings,
      currentProfile: null
    };
  }

  try {
    const savedSettings = storageManager.loadSettings();
    const currentProfile = storageManager.getCurrentProfile();
    
    return {
      gameSettings: savedSettings?.gameSettings || defaultGameSettings,
      hudSettings: savedSettings?.hudSettings || defaultHUDSettings,
      currentProfile: currentProfile || null
    };
  } catch (error) {
    console.error('Failed to initialize store from storage:', error);
    return {
      gameSettings: defaultGameSettings,
      hudSettings: defaultHUDSettings,
      currentProfile: null
    };
  }
};

// Zustandストア（永続化対応）
export const useSimulatorStore = create<SimulatorState>()(
  subscribeWithSelector(
    persist(
      (set, get) => {
        const initialData = initializeStore();
        
        return {
        // 航空機の状態
        aircraft: createDefaultAircraft(initialData.currentProfile?.preferences.defaultAircraft || 'cessna172'),
        setAircraft: (aircraft) =>
          set((state) => {
            const newAircraft = { ...state.aircraft, ...aircraft };
            // フライト記録中の場合はテレメトリを更新
            if (state.currentFlightRecord) {
              get().updateFlightTelemetry();
            }
            return { aircraft: newAircraft };
          }),
        resetAircraft: (type) => {
          const aircraft = createDefaultAircraft(type);
          set({ aircraft });
          
          // プロフィールの優先航空機を更新
          const profile = get().currentProfile;
          if (profile) {
            get().updateProfile({
              preferences: {
                ...profile.preferences,
                defaultAircraft: type
              }
            });
          }
        },
        
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
        gameSettings: initialData.gameSettings,
        setGameSettings: (settings) => {
          set((state) => ({ gameSettings: { ...state.gameSettings, ...settings } }));
          // 設定変更時に自動保存
          setTimeout(() => get().saveSettings(), 100);
        },
        hudSettings: initialData.hudSettings,
        setHUDSettings: (settings) => {
          set((state) => ({ hudSettings: { ...state.hudSettings, ...settings } }));
          // 設定変更時に自動保存
          setTimeout(() => get().saveSettings(), 100);
        },
        
        // シミュレーション時間
        simulationTime: 0,
        deltaTime: 0,
        updateSimulationTime: (delta) => {
          set((state) => ({
            simulationTime: state.simulationTime + delta,
            deltaTime: delta,
          }));
          
          // プロフィール使用時間の更新
          const profile = get().currentProfile;
          if (profile) {
            get().updateProfile({
              totalFlightTime: profile.totalFlightTime + (delta / 60) // 分に変換
            });
          }
        },
        
        // プロフィール管理
        currentProfile: initialData.currentProfile,
        setCurrentProfile: (profile) => {
          set({ currentProfile: profile });
          if (profile) {
            storageManager.setCurrentProfile(profile.id);
            // プロフィールの設定を適用
            set({
              gameSettings: profile.preferences.favoriteSettings,
              weather: profile.preferences.defaultWeather
            });
            get().resetAircraft(profile.preferences.defaultAircraft);
          }
        },
        
        updateProfile: (updates) => {
          const profile = get().currentProfile;
          if (!profile) return;
          
          const updatedProfile = { ...profile, ...updates, lastPlayed: Date.now() };
          set({ currentProfile: updatedProfile });
          storageManager.saveProfile(updatedProfile);
        },
        
        // フライト記録
        currentFlightRecord: null,
        startFlightRecording: () => {
          const state = get();
          const profile = state.currentProfile;
          if (!profile) return;
          
          const flightRecord: FlightRecord = {
            id: `flight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            profileId: profile.id,
            aircraftType: state.aircraft.type,
            startTime: Date.now(),
            endTime: 0,
            duration: 0,
            startPosition: {
              x: state.aircraft.position.x,
              y: state.aircraft.position.y,
              z: state.aircraft.position.z
            },
            endPosition: { x: 0, y: 0, z: 0 },
            maxAltitude: state.aircraft.altitude,
            maxSpeed: state.aircraft.airspeed,
            totalDistance: 0,
            fuelUsed: 0,
            crashed: false,
            achievements: [],
            telemetry: [],
            weather: state.weather
          };
          
          set({ currentFlightRecord: flightRecord });
        },
        
        stopFlightRecording: (landingScore, crashed = false) => {
          const state = get();
          const record = state.currentFlightRecord;
          if (!record) return;
          
          const endTime = Date.now();
          const endPosition = {
            x: state.aircraft.position.x,
            y: state.aircraft.position.y,
            z: state.aircraft.position.z
          };
          
          const distance = Math.sqrt(
            Math.pow(endPosition.x - record.startPosition.x, 2) +
            Math.pow(endPosition.z - record.startPosition.z, 2)
          ) / 1000; // km
          
          const finalRecord: FlightRecord = {
            ...record,
            endTime,
            duration: (endTime - record.startTime) / 60000, // minutes
            endPosition,
            totalDistance: distance,
            fuelUsed: 212 - state.aircraft.fuel, // セスナの燃料容量から逆算
            landingScore,
            crashed,
            telemetry: [...record.telemetry]
          };
          
          // 記録を保存
          storageManager.saveFlightRecord(finalRecord);
          
          // プロフィール統計を更新
          const profile = state.currentProfile;
          if (profile) {
            get().updateProfile({
              totalFlights: profile.totalFlights + 1,
              stats: {
                ...profile.stats,
                totalDistance: profile.stats.totalDistance + distance,
                bestLanding: landingScore ? Math.max(profile.stats.bestLanding, landingScore) : profile.stats.bestLanding,
                longestFlight: Math.max(profile.stats.longestFlight, finalRecord.duration),
                crashCount: profile.stats.crashCount + (crashed ? 1 : 0)
              }
            });
          }
          
          set({ currentFlightRecord: null });
        },
        
        updateFlightTelemetry: () => {
          const state = get();
          const record = state.currentFlightRecord;
          if (!record) return;
          
          const telemetryPoint = createTelemetryPoint(state.aircraft, Date.now(), record.startTime);
          
          // テレメトリ更新（最大1000ポイントまで、10秒間隔）
          const newTelemetry = [...record.telemetry];
          if (newTelemetry.length === 0 || telemetryPoint.t - newTelemetry[newTelemetry.length - 1].t >= 10000) {
            newTelemetry.push(telemetryPoint);
            if (newTelemetry.length > 1000) {
              newTelemetry.shift();
            }
            
            // 最大値の更新
            const updatedRecord = {
              ...record,
              telemetry: newTelemetry,
              maxAltitude: Math.max(record.maxAltitude, state.aircraft.altitude),
              maxSpeed: Math.max(record.maxSpeed, state.aircraft.airspeed)
            };
            
            set({ currentFlightRecord: updatedRecord });
          }
        },
        
        // 設定の永続化
        loadSettings: () => {
          const savedSettings = storageManager.loadSettings();
          if (savedSettings) {
            set({
              gameSettings: savedSettings.gameSettings,
              hudSettings: savedSettings.hudSettings
            });
          }
        },
        
        saveSettings: () => {
          const state = get();
          const settings = {
            gameSettings: state.gameSettings,
            hudSettings: state.hudSettings,
            controlSettings: {
              keyBindings: {}, // 将来の実装用
              joystickSettings: undefined
            },
            version: '1.0.0',
            lastSaved: Date.now()
          };
          
          storageManager.saveSettings(settings);
        },
        
        resetToDefaults: () => {
          set({
            gameSettings: defaultGameSettings,
            hudSettings: defaultHUDSettings,
            aircraft: createDefaultAircraft('cessna172'),
            controls: defaultControls,
            weather: defaultWeather,
            cameraView: 'external'
          });
          get().saveSettings();
        },
        
        // プロフィールの永続化
        loadProfile: async (profileId: string) => {
          const profile = storageManager.getProfile(profileId);
          if (profile) {
            get().setCurrentProfile(profile);
            return true;
          }
          return false;
        },
        
        saveProfile: async () => {
          const profile = get().currentProfile;
          if (!profile) return false;
          
          return storageManager.saveProfile(profile);
        },
        
        createNewProfile: async (name: string) => {
          const profile: UserProfile = {
            id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            createdAt: Date.now(),
            lastPlayed: Date.now(),
            totalFlightTime: 0,
            totalFlights: 0,
            achievements: [],
            preferences: {
              defaultAircraft: 'cessna172',
              defaultWeather: defaultWeather,
              favoriteSettings: defaultGameSettings
            },
            stats: {
              bestLanding: 0,
              longestFlight: 0,
              totalDistance: 0,
              crashCount: 0
            }
          };
          
          const saved = storageManager.saveProfile(profile);
          if (saved) {
            get().setCurrentProfile(profile);
            return profile;
          }
          throw new Error('Failed to save profile');
        },
        
        deleteProfile: async (profileId: string) => {
          const result = storageManager.deleteProfile(profileId);
          const currentProfile = get().currentProfile;
          
          if (result && currentProfile?.id === profileId) {
            set({ currentProfile: null });
          }
          
          return result;
        },
        
        getAllProfiles: () => {
          return storageManager.getAllProfiles();
        },
        
        // 天候システム統合
        updateWeatherFromSystem: () => {
          const state = get();
          const currentWeather = weatherSystem.getWeatherAtPosition(state.aircraft.position);
          set({ weather: currentWeather });
        },
        
        getWeatherAtPosition: (position: Vector3) => {
          return weatherSystem.getWeatherAtPosition(position);
        },
        
        getWeatherForecast: (hoursAhead: number) => {
          const state = get();
          return weatherSystem.generateForecast(state.aircraft.position, hoursAhead);
        },
        
        createWeatherSystem: (center: Vector3, type: string, intensity: number) => {
          weatherSystem.createWeatherSystem(center, type as any, intensity);
        }
        };
      },
      {
        name: 'simulator-settings',
        partialize: (state) => ({
          gameSettings: state.gameSettings,
          hudSettings: state.hudSettings,
          cameraView: state.cameraView
        }),
        // カスタムストレージでstorageManagerを使用（SSR対応）
        storage: {
          getItem: (name: string) => {
            if (typeof window === 'undefined') {
              return null;
            }
            try {
              const data = storageManager.loadSettings();
              return data ? JSON.stringify(data) : null;
            } catch (error) {
              console.error('Failed to load from storageManager:', error);
              return null;
            }
          },
          setItem: (name: string, value: string) => {
            if (typeof window === 'undefined') {
              return;
            }
            try {
              const parsedValue = JSON.parse(value);
              const settings = {
                gameSettings: parsedValue.state?.gameSettings || defaultGameSettings,
                hudSettings: parsedValue.state?.hudSettings || defaultHUDSettings,
                controlSettings: {
                  keyBindings: {},
                  joystickSettings: undefined
                },
                version: '1.0.0',
                lastSaved: Date.now()
              };
              storageManager.saveSettings(settings);
            } catch (error) {
              console.error('Failed to save to storageManager:', error);
            }
          },
          removeItem: (name: string) => {
            if (typeof window === 'undefined') {
              return;
            }
            // 設定のリセット時に使用
            storageManager.clearAllData();
          }
        }
      }
    )
  )
);
