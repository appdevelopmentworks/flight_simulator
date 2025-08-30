/**
 * 動的天候システム
 * リアルタイム天候変化、地域別天候、天候レーダー機能
 */

import * as THREE from 'three';
import { WeatherConditions } from '@/types';

export interface WeatherRegion {
  id: string;
  center: THREE.Vector3;
  radius: number;
  conditions: WeatherConditions;
  movementVector: THREE.Vector3;
  intensity: number;
  type: 'sunny' | 'cloudy' | 'storm' | 'rain' | 'snow' | 'fog';
}

export interface WeatherForecast {
  timestamp: number;
  conditions: WeatherConditions;
  confidence: number;
}

export class WeatherSystem {
  private regions: WeatherRegion[] = [];
  private globalWeather: WeatherConditions;
  private lastUpdate: number = 0;
  private updateInterval: number = 10000; // 10秒間隔
  private weatherHistory: { timestamp: number; weather: WeatherConditions }[] = [];
  
  constructor() {
    this.globalWeather = this.createDefaultWeather();
    this.initializeWeatherRegions();
  }
  
  /**
   * デフォルト天候条件を作成
   */
  private createDefaultWeather(): WeatherConditions {
    return {
      windDirection: 270, // 西風
      windSpeed: 5, // 5 m/s
      visibility: 10, // 10km
      cloudCover: 0.3, // 30%
      precipitation: 'none',
      turbulence: 0.1, // 軽度
      temperature: 15, // 15℃
      pressure: 1013.25 // 標準気圧
    };
  }
  
  /**
   * 初期天候リージョンを設定
   */
  private initializeWeatherRegions(): void {
    // 複数の天候リージョンを作成
    this.regions = [
      {
        id: 'region-1',
        center: new THREE.Vector3(0, 0, 0),
        radius: 5000,
        conditions: this.createDefaultWeather(),
        movementVector: new THREE.Vector3(1, 0, 0.5),
        intensity: 1.0,
        type: 'sunny'
      },
      {
        id: 'region-2',
        center: new THREE.Vector3(10000, 0, 5000),
        radius: 8000,
        conditions: {
          ...this.createDefaultWeather(),
          cloudCover: 0.8,
          precipitation: 'rain',
          windSpeed: 12,
          visibility: 5,
          turbulence: 0.4
        },
        movementVector: new THREE.Vector3(-0.8, 0, -0.3),
        intensity: 0.7,
        type: 'rain'
      },
      {
        id: 'region-3',
        center: new THREE.Vector3(-8000, 0, -3000),
        radius: 6000,
        conditions: {
          ...this.createDefaultWeather(),
          cloudCover: 0.9,
          windSpeed: 20,
          turbulence: 0.8,
          visibility: 3,
          temperature: 10
        },
        movementVector: new THREE.Vector3(1.2, 0, 0.8),
        intensity: 0.9,
        type: 'storm'
      }
    ];
  }
  
  /**
   * 指定位置の天候を取得
   */
  getWeatherAtPosition(position: THREE.Vector3): WeatherConditions {
    // 位置に最も近い影響力のある天候リージョンを見つける
    let resultWeather = { ...this.globalWeather };
    let totalInfluence = 0;
    
    this.regions.forEach(region => {
      const distance = position.distanceTo(region.center);
      if (distance < region.radius) {
        // 距離に基づく影響力を計算（中心ほど強い影響）
        const influence = (1 - distance / region.radius) * region.intensity;
        totalInfluence += influence;
        
        // 天候条件を重み付け合成
        Object.keys(region.conditions).forEach(key => {
          const weatherKey = key as keyof WeatherConditions;
          if (typeof region.conditions[weatherKey] === 'number' && typeof resultWeather[weatherKey] === 'number') {
            (resultWeather[weatherKey] as number) = 
              ((resultWeather[weatherKey] as number) * (1 - influence)) + 
              ((region.conditions[weatherKey] as number) * influence);
          } else if (weatherKey === 'precipitation') {
            // 降水は最も強い影響を持つリージョンの条件を使用
            if (influence > 0.5) {
              resultWeather.precipitation = region.conditions.precipitation;
            }
          }
        });
      }
    });
    
    // 影響がない場合はグローバル天候を使用
    if (totalInfluence === 0) {
      return this.globalWeather;
    }
    
    return resultWeather;
  }
  
  /**
   * 天候システムの更新（リアルタイム変化）
   */
  update(deltaTime: number): void {
    const currentTime = Date.now();
    
    if (currentTime - this.lastUpdate < this.updateInterval) {
      return;
    }
    
    // 天候リージョンを移動
    this.regions.forEach(region => {
      region.center.add(region.movementVector.clone().multiplyScalar(deltaTime * 0.001));
      
      // 天候条件の自然な変化
      this.updateRegionWeather(region, deltaTime);
    });
    
    // グローバル天候の緩やかな変化
    this.updateGlobalWeather(deltaTime);
    
    // 履歴を保存
    this.weatherHistory.push({
      timestamp: currentTime,
      weather: { ...this.globalWeather }
    });
    
    // 履歴の上限を保つ（24時間分 = 8640回更新）
    if (this.weatherHistory.length > 8640) {
      this.weatherHistory.shift();
    }
    
    this.lastUpdate = currentTime;
  }
  
  /**
   * リージョン天候の更新
   */
  private updateRegionWeather(region: WeatherRegion, deltaTime: number): void {
    const conditions = region.conditions;
    const changeRate = deltaTime * 0.0001; // 変化率
    
    // 風向の変化（-5度から+5度のランダム変化）
    conditions.windDirection += (Math.random() - 0.5) * 10 * changeRate;
    conditions.windDirection = (conditions.windDirection + 360) % 360;
    
    // 風速の変化
    const windChange = (Math.random() - 0.5) * 2 * changeRate;
    conditions.windSpeed = Math.max(0, Math.min(50, conditions.windSpeed + windChange));
    
    // 雲量の変化
    const cloudChange = (Math.random() - 0.5) * 0.1 * changeRate;
    conditions.cloudCover = Math.max(0, Math.min(1, conditions.cloudCover + cloudChange));
    
    // 乱気流の変化（雲量と風速に関連）
    conditions.turbulence = Math.min(1, (conditions.cloudCover * 0.5) + (conditions.windSpeed / 50));
    
    // 視程の変化（降水と雲量に関連）
    const baseVisibility = conditions.precipitation === 'none' ? 15 : 
                          conditions.precipitation === 'rain' ? 8 : 5;
    conditions.visibility = baseVisibility * (1 - conditions.cloudCover * 0.3);
    
    // 温度の自然変化
    const tempChange = (Math.random() - 0.5) * 1 * changeRate;
    conditions.temperature += tempChange;
  }
  
  /**
   * グローバル天候の更新
   */
  private updateGlobalWeather(deltaTime: number): void {
    // 非常に緩やかな変化
    const changeRate = deltaTime * 0.00001;
    
    this.globalWeather.windDirection += (Math.random() - 0.5) * 5 * changeRate;
    this.globalWeather.windDirection = (this.globalWeather.windDirection + 360) % 360;
    
    const windChange = (Math.random() - 0.5) * 1 * changeRate;
    this.globalWeather.windSpeed = Math.max(0, Math.min(30, this.globalWeather.windSpeed + windChange));
  }
  
  /**
   * 天候予報を生成
   */
  generateForecast(position: THREE.Vector3, hoursAhead: number): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];
    const currentTime = Date.now();
    const hourMs = 60 * 60 * 1000;
    
    for (let hour = 1; hour <= hoursAhead; hour++) {
      const futureTime = currentTime + (hour * hourMs);
      
      // 簡略化された予報計算（実際はより複雑な気象モデルを使用）
      const currentWeather = this.getWeatherAtPosition(position);
      const predictedWeather = { ...currentWeather };
      
      // 時間経過による変化を予測
      const hourlyChange = hour * 0.1;
      predictedWeather.windSpeed += (Math.random() - 0.5) * 5 * hourlyChange;
      predictedWeather.cloudCover += (Math.random() - 0.5) * 0.3 * hourlyChange;
      predictedWeather.temperature += (Math.random() - 0.5) * 3 * hourlyChange;
      
      // 境界値チェック
      predictedWeather.windSpeed = Math.max(0, Math.min(50, predictedWeather.windSpeed));
      predictedWeather.cloudCover = Math.max(0, Math.min(1, predictedWeather.cloudCover));
      
      // 予報の信頼度（時間が先ほど低下）
      const confidence = Math.max(0.3, 1 - (hour * 0.15));
      
      forecasts.push({
        timestamp: futureTime,
        conditions: predictedWeather,
        confidence
      });
    }
    
    return forecasts;
  }
  
  /**
   * 天候レーダーデータを生成
   */
  generateRadarData(centerPosition: THREE.Vector3, range: number): {
    position: THREE.Vector3;
    intensity: number;
    type: string;
  }[] {
    const radarData: { position: THREE.Vector3; intensity: number; type: string }[] = [];
    
    this.regions.forEach(region => {
      const distance = centerPosition.distanceTo(region.center);
      
      if (distance <= range) {
        // リージョン内の降水や雲を検出
        if (region.conditions.precipitation !== 'none' || region.conditions.cloudCover > 0.5) {
          const intensity = region.conditions.precipitation === 'none' 
            ? region.conditions.cloudCover 
            : region.conditions.precipitation === 'rain' ? 0.7 : 0.9;
          
          radarData.push({
            position: region.center.clone(),
            intensity,
            type: region.conditions.precipitation !== 'none' 
              ? region.conditions.precipitation 
              : 'cloud'
          });
        }
      }
    });
    
    return radarData;
  }
  
  /**
   * 新しい天候リージョンを作成
   */
  createWeatherSystem(center: THREE.Vector3, type: WeatherRegion['type'], intensity: number): void {
    const baseConditions = this.createDefaultWeather();
    let conditions: WeatherConditions;
    
    switch (type) {
      case 'storm':
        conditions = {
          ...baseConditions,
          windSpeed: 15 + intensity * 20,
          cloudCover: 0.8 + intensity * 0.2,
          precipitation: 'rain',
          turbulence: 0.5 + intensity * 0.5,
          visibility: 10 - intensity * 7
        };
        break;
      case 'rain':
        conditions = {
          ...baseConditions,
          windSpeed: 8 + intensity * 10,
          cloudCover: 0.6 + intensity * 0.3,
          precipitation: 'rain',
          turbulence: 0.2 + intensity * 0.3,
          visibility: 15 - intensity * 8
        };
        break;
      case 'fog':
        conditions = {
          ...baseConditions,
          windSpeed: 2,
          cloudCover: 1.0,
          turbulence: 0.1,
          visibility: 5 - intensity * 4
        };
        break;
      default:
        conditions = baseConditions;
    }
    
    const newRegion: WeatherRegion = {
      id: `region-${Date.now()}`,
      center: center.clone(),
      radius: 3000 + intensity * 5000,
      conditions,
      movementVector: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
      ),
      intensity,
      type
    };
    
    this.regions.push(newRegion);
  }
  
  /**
   * 天候履歴を取得
   */
  getWeatherHistory(): { timestamp: number; weather: WeatherConditions }[] {
    return [...this.weatherHistory];
  }
  
  /**
   * システム情報の取得
   */
  getSystemInfo() {
    return {
      regionCount: this.regions.length,
      globalWeather: this.globalWeather,
      lastUpdate: this.lastUpdate,
      historyLength: this.weatherHistory.length
    };
  }
}

// シングルトンインスタンス
export const weatherSystem = new WeatherSystem();