/**
 * ローカルストレージ管理システム
 * ゲーム設定、フライト記録、プロフィール情報の永続化
 */

import { GameSettings, HUDSettings, Aircraft, WeatherConditions } from '@/types';
import { logMediumError, logHighError, ERROR_CODES } from './errorHandler';

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  createdAt: number;
  lastPlayed: number;
  totalFlightTime: number; // minutes
  totalFlights: number;
  achievements: Achievement[];
  preferences: {
    defaultAircraft: 'cessna172' | 'boeing737' | 'f16';
    defaultWeather: WeatherConditions;
    favoriteSettings: GameSettings;
  };
  stats: {
    bestLanding: number; // score
    longestFlight: number; // minutes
    totalDistance: number; // km
    crashCount: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
  category: 'flight' | 'landing' | 'navigation' | 'time' | 'special';
}

export interface FlightRecord {
  id: string;
  profileId: string;
  aircraftType: 'cessna172' | 'boeing737' | 'f16';
  startTime: number;
  endTime: number;
  duration: number; // minutes
  startPosition: { x: number; y: number; z: number };
  endPosition: { x: number; y: number; z: number };
  maxAltitude: number;
  maxSpeed: number;
  totalDistance: number;
  fuelUsed: number;
  landingScore?: number; // if landed
  crashed: boolean;
  achievements: string[]; // achievement IDs unlocked during flight
  telemetry: CompressedTelemetry[];
  weather: WeatherConditions;
}

export interface CompressedTelemetry {
  t: number; // timestamp relative to start
  p: [number, number, number]; // position
  r: [number, number, number]; // rotation
  v: number; // airspeed
  a: number; // altitude
  th: number; // throttle
  f: number; // fuel
}

export interface SavedSettings {
  gameSettings: GameSettings;
  hudSettings: HUDSettings;
  controlSettings: {
    keyBindings: Record<string, string>;
    joystickSettings?: {
      deadzone: number;
      sensitivity: number;
      invertAxes: boolean[];
    };
  };
  version: string;
  lastSaved: number;
}

class StorageManager {
  private readonly STORAGE_PREFIX = 'flight_simulator_';
  private readonly VERSION = '1.0.0';
  
  // Storage keys
  private readonly KEYS = {
    SETTINGS: 'settings',
    PROFILES: 'profiles',
    CURRENT_PROFILE: 'current_profile',
    FLIGHT_RECORDS: 'flight_records',
    ACHIEVEMENTS: 'achievements',
    PERFORMANCE_DATA: 'performance_data'
  } as const;

  /**
   * ブラウザ環境チェック
   */
  private isClient(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * ローカルストレージへの安全な書き込み
   */
  private setItem(key: string, data: any): boolean {
    if (!this.isClient()) {
      return false;
    }

    try {
      const fullKey = this.STORAGE_PREFIX + key;
      const serializedData = JSON.stringify({
        version: this.VERSION,
        timestamp: Date.now(),
        data
      });
      
      localStorage.setItem(fullKey, serializedData);
      return true;
    } catch (error) {
      logHighError(
        'STORAGE_WRITE_ERROR',
        `Failed to save data to localStorage: ${key}`,
        { key, error: String(error) }
      );
      return false;
    }
  }

  /**
   * ローカルストレージからの安全な読み取り
   */
  private getItem<T>(key: string): T | null {
    if (!this.isClient()) {
      return null;
    }

    try {
      const fullKey = this.STORAGE_PREFIX + key;
      const item = localStorage.getItem(fullKey);
      
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      // バージョンチェック
      if (parsed.version !== this.VERSION) {
        logMediumError(
          'STORAGE_VERSION_MISMATCH',
          `Storage version mismatch for ${key}: ${parsed.version} vs ${this.VERSION}`,
          { key, storedVersion: parsed.version, currentVersion: this.VERSION }
        );
        return null;
      }
      
      return parsed.data as T;
    } catch (error) {
      logHighError(
        'STORAGE_READ_ERROR',
        `Failed to read data from localStorage: ${key}`,
        { key, error: String(error) }
      );
      return null;
    }
  }

  /**
   * 設定の保存
   */
  saveSettings(settings: SavedSettings): boolean {
    const dataToSave: SavedSettings = {
      ...settings,
      version: this.VERSION,
      lastSaved: Date.now()
    };
    
    return this.setItem(this.KEYS.SETTINGS, dataToSave);
  }

  /**
   * 設定の読み込み
   */
  loadSettings(): SavedSettings | null {
    return this.getItem<SavedSettings>(this.KEYS.SETTINGS);
  }

  /**
   * ユーザープロフィールの保存
   */
  saveProfile(profile: UserProfile): boolean {
    const profiles = this.getAllProfiles();
    const existingIndex = profiles.findIndex(p => p.id === profile.id);
    
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }
    
    return this.setItem(this.KEYS.PROFILES, profiles);
  }

  /**
   * 全プロフィールの取得
   */
  getAllProfiles(): UserProfile[] {
    return this.getItem<UserProfile[]>(this.KEYS.PROFILES) || [];
  }

  /**
   * 特定プロフィールの取得
   */
  getProfile(profileId: string): UserProfile | null {
    const profiles = this.getAllProfiles();
    return profiles.find(p => p.id === profileId) || null;
  }

  /**
   * 現在のプロフィールの設定
   */
  setCurrentProfile(profileId: string): boolean {
    return this.setItem(this.KEYS.CURRENT_PROFILE, profileId);
  }

  /**
   * 現在のプロフィールの取得
   */
  getCurrentProfile(): UserProfile | null {
    const currentProfileId = this.getItem<string>(this.KEYS.CURRENT_PROFILE);
    if (!currentProfileId) return null;
    
    return this.getProfile(currentProfileId);
  }

  /**
   * プロフィールの削除
   */
  deleteProfile(profileId: string): boolean {
    const profiles = this.getAllProfiles();
    const filteredProfiles = profiles.filter(p => p.id !== profileId);
    
    // 現在のプロフィールが削除対象の場合はクリア
    const currentProfileId = this.getItem<string>(this.KEYS.CURRENT_PROFILE);
    if (currentProfileId === profileId) {
      this.setItem(this.KEYS.CURRENT_PROFILE, null);
    }
    
    return this.setItem(this.KEYS.PROFILES, filteredProfiles);
  }

  /**
   * フライト記録の保存
   */
  saveFlightRecord(record: FlightRecord): boolean {
    const records = this.getAllFlightRecords();
    records.push(record);
    
    // 最大1000記録まで保持
    if (records.length > 1000) {
      records.sort((a, b) => b.startTime - a.startTime);
      records.splice(1000);
    }
    
    return this.setItem(this.KEYS.FLIGHT_RECORDS, records);
  }

  /**
   * 全フライト記録の取得
   */
  getAllFlightRecords(): FlightRecord[] {
    return this.getItem<FlightRecord[]>(this.KEYS.FLIGHT_RECORDS) || [];
  }

  /**
   * プロフィール別フライト記録の取得
   */
  getFlightRecordsByProfile(profileId: string): FlightRecord[] {
    const allRecords = this.getAllFlightRecords();
    return allRecords.filter(record => record.profileId === profileId);
  }

  /**
   * フライト記録の削除
   */
  deleteFlightRecord(recordId: string): boolean {
    const records = this.getAllFlightRecords();
    const filteredRecords = records.filter(r => r.id !== recordId);
    
    return this.setItem(this.KEYS.FLIGHT_RECORDS, filteredRecords);
  }

  /**
   * 実績の保存
   */
  saveAchievements(profileId: string, achievements: Achievement[]): boolean {
    const allAchievements = this.getItem<Record<string, Achievement[]>>(this.KEYS.ACHIEVEMENTS) || {};
    allAchievements[profileId] = achievements;
    
    return this.setItem(this.KEYS.ACHIEVEMENTS, allAchievements);
  }

  /**
   * 実績の取得
   */
  getAchievements(profileId: string): Achievement[] {
    const allAchievements = this.getItem<Record<string, Achievement[]>>(this.KEYS.ACHIEVEMENTS) || {};
    return allAchievements[profileId] || [];
  }

  /**
   * データのエクスポート
   */
  exportData(): string {
    const data = {
      settings: this.loadSettings(),
      profiles: this.getAllProfiles(),
      currentProfile: this.getItem<string>(this.KEYS.CURRENT_PROFILE),
      flightRecords: this.getAllFlightRecords(),
      achievements: this.getItem<Record<string, Achievement[]>>(this.KEYS.ACHIEVEMENTS),
      exportedAt: Date.now(),
      version: this.VERSION
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * データのインポート
   */
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // バージョンチェック
      if (data.version !== this.VERSION) {
        logMediumError(
          'IMPORT_VERSION_MISMATCH',
          `Import version mismatch: ${data.version} vs ${this.VERSION}`,
          { importVersion: data.version, currentVersion: this.VERSION }
        );
      }
      
      // データをインポート
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      
      if (data.profiles && Array.isArray(data.profiles)) {
        this.setItem(this.KEYS.PROFILES, data.profiles);
      }
      
      if (data.currentProfile) {
        this.setCurrentProfile(data.currentProfile);
      }
      
      if (data.flightRecords && Array.isArray(data.flightRecords)) {
        this.setItem(this.KEYS.FLIGHT_RECORDS, data.flightRecords);
      }
      
      if (data.achievements) {
        this.setItem(this.KEYS.ACHIEVEMENTS, data.achievements);
      }
      
      return true;
    } catch (error) {
      logHighError(
        'IMPORT_FAILED',
        'Failed to import data',
        { error: String(error) }
      );
      return false;
    }
  }

  /**
   * ストレージサイズの取得
   */
  getStorageSize(): { used: number; available: number } {
    let used = 0;
    
    if (!this.isClient()) {
      return { used: 0, available: 5 * 1024 * 1024 };
    }
    
    try {
      for (const key in localStorage) {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          used += localStorage.getItem(key)?.length || 0;
        }
      }
    } catch (error) {
      logMediumError(
        'STORAGE_SIZE_CHECK_FAILED',
        'Failed to calculate storage size',
        { error: String(error) }
      );
    }
    
    // おおよその利用可能サイズ（5MBと仮定）
    const available = 5 * 1024 * 1024 - used;
    
    return { used, available: Math.max(0, available) };
  }

  /**
   * ストレージのクリア
   */
  clearAllData(): boolean {
    if (!this.isClient()) {
      return false;
    }

    try {
      const keysToRemove: string[] = [];
      
      for (const key in localStorage) {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      return true;
    } catch (error) {
      logHighError(
        'STORAGE_CLEAR_FAILED',
        'Failed to clear storage data',
        { error: String(error) }
      );
      return false;
    }
  }

  /**
   * 自動バックアップの作成
   */
  createAutoBackup(): boolean {
    const backup = {
      data: this.exportData(),
      createdAt: Date.now(),
      type: 'auto'
    };
    
    const backups = this.getItem<any[]>('backups') || [];
    backups.push(backup);
    
    // 最大10個のバックアップを保持
    if (backups.length > 10) {
      backups.sort((a, b) => b.createdAt - a.createdAt);
      backups.splice(10);
    }
    
    return this.setItem('backups', backups);
  }

  /**
   * バックアップの取得
   */
  getBackups(): any[] {
    return this.getItem<any[]>('backups') || [];
  }
}

// シングルトンインスタンス
export const storageManager = new StorageManager();

/**
 * ストレージの可用性チェック
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    const testKey = 'test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 設定の自動保存フック用ユーティリティ
 */
export function createAutoSaver(interval: number = 30000) {
  return {
    start: (saveCallback: () => void) => {
      return setInterval(saveCallback, interval);
    },
    stop: (intervalId: NodeJS.Timeout) => {
      clearInterval(intervalId);
    }
  };
}