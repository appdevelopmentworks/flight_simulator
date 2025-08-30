/**
 * ILS/航法システム
 * 視覚的ILS、VOR/DME、GPS、ウェイポイント管理
 */

import * as THREE from 'three';
import { Vector3 } from 'three';
import { Aircraft, Waypoint, Airport, Runway } from '@/types';

export interface ILSSignal {
  runway: string;
  frequency: number;
  localizer: {
    course: number; // 磁針路
    deviation: number; // -2.5 ~ +2.5 dots
    valid: boolean;
  };
  glideslope: {
    angle: number; // 通常3度
    deviation: number; // -2.5 ~ +2.5 dots
    valid: boolean;
  };
  distance: number; // DME距離
  altitude: number; // 決心高度
}

export interface VORSignal {
  id: string;
  name: string;
  frequency: number;
  position: Vector3;
  bearing: number; // FROM bearing
  deviation: number; // CDI needle deviation
  distance: number; // DME距離
  valid: boolean;
}

export interface GPSFix {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number; // meters
  satellites: number;
  timestamp: number;
}

export interface NavigationState {
  gps: {
    fix: GPSFix;
    waypoints: Waypoint[];
    activeWaypoint: Waypoint | null;
    nextWaypoint: Waypoint | null;
    course: number;
    distance: number;
    eta: number;
    crossTrackError: number;
  };
  ils: ILSSignal | null;
  vor: VORSignal[];
  compass: {
    magneticHeading: number;
    trueHeading: number;
    magneticDeclination: number;
  };
  navigation: {
    mode: 'GPS' | 'VOR' | 'ILS' | 'MANUAL';
    autopilotCoupled: boolean;
    selectedCourse: number;
    selectedAltitude: number;
  };
}

export class NavigationSystem {
  private airports: Airport[] = [];
  private vorStations: VORSignal[] = [];
  private waypoints: Waypoint[] = [];
  private flightPlan: Waypoint[] = [];
  private activeWaypointIndex: number = 0;

  constructor() {
    this.initializeNavDatabase();
  }

  /**
   * 航法データベースの初期化
   */
  private initializeNavDatabase(): void {
    // 羽田空港のILS設定
    this.airports.push({
      id: 'RJTT',
      name: 'Tokyo Haneda',
      icaoCode: 'RJTT',
      position: new Vector3(0, 0, 0),
      elevation: 6, // 6m
      runways: [
        {
          id: '34R',
          heading: 340,
          length: 3000,
          width: 60,
          position: new Vector3(0, 0, 0),
          hasILS: true
        },
        {
          id: '16L',
          heading: 160,
          length: 3000,
          width: 60,
          position: new Vector3(0, 0, 0),
          hasILS: true
        }
      ]
    });

    // VOR局の設定
    this.vorStations = [
      {
        id: 'HNE',
        name: 'Haneda VOR',
        frequency: 108.8,
        position: new Vector3(1000, 0, 1000),
        bearing: 0,
        deviation: 0,
        distance: 0,
        valid: true
      },
      {
        id: 'NRT',
        name: 'Narita VOR',
        frequency: 112.3,
        position: new Vector3(50000, 0, 20000),
        bearing: 0,
        deviation: 0,
        distance: 0,
        valid: true
      }
    ];

    // 基本ウェイポイント
    this.waypoints = [
      {
        id: 'HANEDA',
        name: 'Haneda Airport',
        position: new Vector3(0, 6, 0),
        altitude: 6,
        type: 'airport'
      },
      {
        id: 'WAYPOINT1',
        name: 'Initial Climb',
        position: new Vector3(-5000, 500, -5000),
        altitude: 500,
        type: 'waypoint'
      },
      {
        id: 'WAYPOINT2',
        name: 'Cruise Point',
        position: new Vector3(-20000, 3000, -20000),
        altitude: 3000,
        type: 'waypoint'
      },
      {
        id: 'APPROACH',
        name: 'Approach Fix',
        position: new Vector3(15000, 1000, 15000),
        altitude: 1000,
        type: 'waypoint'
      }
    ];
  }

  /**
   * 航法状態の更新
   */
  updateNavigation(aircraft: Aircraft): NavigationState {
    const gpsState = this.updateGPS(aircraft);
    const ilsSignal = this.calculateILSSignal(aircraft);
    const vorSignals = this.updateVORSignals(aircraft);
    const compassState = this.updateCompass(aircraft);

    return {
      gps: gpsState,
      ils: ilsSignal,
      vor: vorSignals,
      compass: compassState,
      navigation: {
        mode: 'GPS',
        autopilotCoupled: false,
        selectedCourse: 0,
        selectedAltitude: aircraft.altitude
      }
    };
  }

  /**
   * GPS状態の更新
   */
  private updateGPS(aircraft: Aircraft): NavigationState['gps'] {
    const fix: GPSFix = {
      latitude: aircraft.position.x * 0.00001, // 簡略座標変換
      longitude: aircraft.position.z * 0.00001,
      altitude: aircraft.altitude,
      accuracy: 3,
      satellites: 8,
      timestamp: Date.now()
    };

    // アクティブウェイポイント
    const activeWaypoint = this.flightPlan[this.activeWaypointIndex] || null;
    const nextWaypoint = this.flightPlan[this.activeWaypointIndex + 1] || null;

    let course = 0;
    let distance = 0;
    let crossTrackError = 0;
    let eta = 0;

    if (activeWaypoint) {
      const toWaypoint = new Vector3().copy(activeWaypoint.position).sub(aircraft.position);
      distance = toWaypoint.length() / 1000; // km
      course = Math.atan2(toWaypoint.x, -toWaypoint.z) * 180 / Math.PI;
      if (course < 0) course += 360;

      // 所要時間計算
      const groundSpeed = aircraft.velocity.length() * 3.6; // km/h
      eta = groundSpeed > 0 ? distance / groundSpeed * 60 : 0; // minutes

      // Cross Track Error (簡略計算)
      if (nextWaypoint) {
        const trackVector = new Vector3().copy(nextWaypoint.position).sub(activeWaypoint.position).normalize();
        const aircraftVector = new Vector3().copy(aircraft.position).sub(activeWaypoint.position);
        crossTrackError = aircraftVector.cross(trackVector).length() / 1000; // km
      }

      // ウェイポイント通過判定
      if (distance < 0.5) { // 500m以内
        this.activeWaypointIndex++;
      }
    }

    return {
      fix,
      waypoints: this.waypoints,
      activeWaypoint,
      nextWaypoint,
      course,
      distance,
      eta,
      crossTrackError
    };
  }

  /**
   * ILS信号の計算
   */
  private calculateILSSignal(aircraft: Aircraft): ILSSignal | null {
    // 羽田34Rの簡略ILS
    const runway = this.airports[0].runways[0];
    if (!runway.hasILS) return null;

    const runwayPosition = runway.position;
    const runwayHeading = runway.heading;
    
    // 航空機から滑走路への距離とベアリング
    const toRunway = new Vector3().copy(runwayPosition).sub(aircraft.position);
    const distance = toRunway.length() / 1000; // km

    // ILSの有効範囲チェック（通常25nm以内）
    if (distance > 46) return null;

    // ローカライザー偏差計算
    const aircraftBearing = Math.atan2(toRunway.x, -toRunway.z) * 180 / Math.PI;
    let localizerDeviation = (aircraftBearing - runwayHeading) / 2.5; // dots
    localizerDeviation = Math.max(-2.5, Math.min(2.5, localizerDeviation));

    // グライドスロープ偏差計算（3度グライドパス）
    const glideslopeAngle = 3; // degrees
    const expectedAltitude = runwayPosition.y + Math.tan(glideslopeAngle * Math.PI / 180) * distance * 1000;
    let glideslopeDeviation = (aircraft.altitude - expectedAltitude) / 100; // dots
    glideslopeDeviation = Math.max(-2.5, Math.min(2.5, glideslopeDeviation));

    return {
      runway: '34R',
      frequency: 109.1,
      localizer: {
        course: runwayHeading,
        deviation: localizerDeviation,
        valid: distance < 18.5 // 10nm以内で有効
      },
      glideslope: {
        angle: glideslopeAngle,
        deviation: glideslopeDeviation,
        valid: distance < 9.3 && aircraft.altitude < 2000 // 5nm以内、2000ft以下
      },
      distance: distance,
      altitude: 200 // 決心高度200ft
    };
  }

  /**
   * VOR信号の更新
   */
  private updateVORSignals(aircraft: Aircraft): VORSignal[] {
    return this.vorStations.map(station => {
      const toStation = new Vector3().copy(station.position).sub(aircraft.position);
      const distance = toStation.length() / 1000; // km
      const bearing = Math.atan2(toStation.x, -toStation.z) * 180 / Math.PI;
      
      return {
        ...station,
        bearing: bearing < 0 ? bearing + 360 : bearing,
        distance,
        valid: distance < 200 // 200km以内で有効
      };
    });
  }

  /**
   * コンパス状態の更新
   */
  private updateCompass(aircraft: Aircraft): NavigationState['compass'] {
    const magneticDeclination = -7; // 日本付近の磁気偏角
    const trueHeading = aircraft.heading;
    const magneticHeading = trueHeading + magneticDeclination;

    return {
      magneticHeading: magneticHeading < 0 ? magneticHeading + 360 : magneticHeading % 360,
      trueHeading,
      magneticDeclination
    };
  }

  /**
   * フライトプランの設定
   */
  setFlightPlan(waypoints: Waypoint[]): void {
    this.flightPlan = [...waypoints];
    this.activeWaypointIndex = 0;
  }

  /**
   * ウェイポイントの追加
   */
  addWaypoint(waypoint: Waypoint): void {
    this.flightPlan.push(waypoint);
  }

  /**
   * ウェイポイントの削除
   */
  removeWaypoint(index: number): void {
    if (index >= 0 && index < this.flightPlan.length) {
      this.flightPlan.splice(index, 1);
      if (this.activeWaypointIndex >= this.flightPlan.length) {
        this.activeWaypointIndex = Math.max(0, this.flightPlan.length - 1);
      }
    }
  }

  /**
   * 次のウェイポイントへ進む
   */
  nextWaypoint(): void {
    if (this.activeWaypointIndex < this.flightPlan.length - 1) {
      this.activeWaypointIndex++;
    }
  }

  /**
   * 前のウェイポイントに戻る
   */
  previousWaypoint(): void {
    if (this.activeWaypointIndex > 0) {
      this.activeWaypointIndex--;
    }
  }

  /**
   * 最寄りの空港を検索
   */
  findNearestAirport(position: Vector3): Airport | null {
    let nearest: Airport | null = null;
    let minDistance = Infinity;

    this.airports.forEach(airport => {
      const distance = position.distanceTo(airport.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = airport;
      }
    });

    return nearest;
  }

  /**
   * フライトプランの取得
   */
  getFlightPlan(): Waypoint[] {
    return [...this.flightPlan];
  }

  /**
   * システム情報の取得
   */
  getSystemInfo() {
    return {
      airportCount: this.airports.length,
      vorStationCount: this.vorStations.length,
      waypointCount: this.waypoints.length,
      flightPlanLength: this.flightPlan.length,
      activeWaypointIndex: this.activeWaypointIndex
    };
  }
}

// シングルトンインスタンス
export const navigationSystem = new NavigationSystem();