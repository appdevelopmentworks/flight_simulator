'use client';

import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import * as THREE from 'three';
import { useRef, useCallback } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { updateAircraftPhysics, checkStall, checkGroundCollision, calculateAutopilotControls } from '@/physics/aerodynamics';
import { logMediumError, ERROR_CODES } from '@/utils/errorHandler';
import { performanceMonitor, throttle, debounce } from '@/utils/performance';
import { weatherSystem } from '@/systems/WeatherSystem';
import { audioSystem } from '@/systems/AudioSystem';
import { advancedAerodynamics } from '@/physics/advancedAerodynamics';

export const usePhysicsUpdate = () => {
  const store = useSimulatorStore();
  
  // パフォーマンス最適化用の状態
  const frameCount = useRef(0);
  const lastStallCheck = useRef(0);
  const lastGroundCheck = useRef(0);
  const physicsCache = useRef<{
    lastAircraft?: any;
    lastControls?: any;
    lastWeather?: any;
    canSkipUpdate?: boolean;
  }>({});
  
  // 重い計算をスロットル化
  const throttledStallCheck = useCallback(
    throttle((aircraft: any) => checkStall(aircraft), 200), // 200ms間隔
    [checkStall]
  );
  
  const throttledGroundCheck = useCallback(
    throttle((aircraft: any) => checkGroundCollision(aircraft), 100), // 100ms間隔
    [checkGroundCollision]
  );
  
  useFrame((state, delta) => {
    // パフォーマンス監視開始
    performanceMonitor.startFrame();
    
    // ポーズ中は物理演算を停止
    if (store.isPaused) {
      performanceMonitor.endFrame();
      return;
    }
    
    frameCount.current++;
    const { aircraft, controls, weather } = store;
    
    // 天候システムの更新
    weatherSystem.update(delta * 1000); // deltaTimeをミリ秒に変換
    
    // 航空機位置での天候を取得して更新
    if (frameCount.current % 30 === 0) { // 30フレームに1回（0.5秒間隔@60FPS）
      store.updateWeatherFromSystem();
      
      // 環境音の更新
      audioSystem.updateEnvironmentalAudio(weather, aircraft.altitude);
      
      // 3D空間オーディオリスナーの更新
      const forward = new THREE.Vector3(0, 0, -1).applyEuler(aircraft.rotation);
      const up = new THREE.Vector3(0, 1, 0).applyEuler(aircraft.rotation);
      audioSystem.updateSpatialListener(aircraft.position, forward, up);
    }
    
    // aircraftが無効な場合はスキップ
    if (!aircraft || !aircraft.type) {
      logMediumError(
        ERROR_CODES.AIRCRAFT_INVALID_STATE,
        'Invalid aircraft state in usePhysicsUpdate',
        { aircraft: aircraft || 'null', controls, weather }
      );
      performanceMonitor.endFrame();
      return;
    }
    
    // 適応的タイムステップ - パフォーマンスに基づいて調整
    const avgFps = performanceMonitor.getAverageFPS();
    let targetDelta = 1 / 60; // 60FPS target
    
    if (avgFps < 45) {
      // パフォーマンスが低い場合、物理更新頻度を下げる
      if (frameCount.current % 2 !== 0) {
        performanceMonitor.endFrame();
        return; // 1フレーム飛ばす
      }
      targetDelta = 1 / 30; // 30FPS相当
    } else if (avgFps < 30) {
      // 非常に低い場合
      if (frameCount.current % 3 !== 0) {
        performanceMonitor.endFrame();
        return; // 2フレーム飛ばす
      }
      targetDelta = 1 / 20; // 20FPS相当
    }
    
    const clampedDelta = Math.min(delta, targetDelta);
    
    // 変更検出による最適化
    const cache = physicsCache.current;
    const hasSignificantChange = (
      !cache.lastAircraft || 
      Math.abs(aircraft.throttle - cache.lastAircraft.throttle) > 0.01 ||
      Math.abs(controls.pitch - (cache.lastControls?.pitch || 0)) > 0.01 ||
      Math.abs(controls.roll - (cache.lastControls?.roll || 0)) > 0.01 ||
      aircraft.airspeed > 10 // 停止時は常に更新
    );
    
    if (!hasSignificantChange && avgFps > 50) {
      // 小さな変化でパフォーマンスが良い場合は更新をスキップ
      cache.canSkipUpdate = true;
      performanceMonitor.endFrame();
      return;
    }
    
    // オートパイロットが有効な場合のコントロール調整（最適化: 必要時のみ）
    let effectiveControls = controls;
    if (controls.autopilot) {
      const autopilotControls = calculateAutopilotControls(
        aircraft,
        1000, // 目標高度（仮）
        aircraft.heading // 現在の方位を維持
      );
      effectiveControls = { ...controls, ...autopilotControls };
    }
    
    // 高度な空力計算
    const advancedAero = advancedAerodynamics.calculateAdvancedAerodynamics(
      aircraft,
      effectiveControls,
      weather,
      clampedDelta
    );
    
    // メイン物理演算の更新（高度な空力結果を統合）
    const updatedAircraft = updateAircraftPhysics(
      aircraft,
      effectiveControls,
      weather,
      clampedDelta,
      advancedAero
    );
    
    // 地面衝突チェック（最適化: 低高度時のみ頻繁にチェック）
    const tempAircraft = { ...aircraft, ...updatedAircraft };
    const currentTime = performance.now();
    
    let shouldCheckGround = aircraft.altitude < 100; // 低高度時は常にチェック
    if (!shouldCheckGround && currentTime - lastGroundCheck.current > 500) {
      shouldCheckGround = true; // 高高度時は500ms間隔
      lastGroundCheck.current = currentTime;
    }
    
    if (shouldCheckGround && checkGroundCollision(tempAircraft)) {
      // 着陸または墜落の処理
      if (aircraft.landingGear && aircraft.airspeed < 200) {
        // 安全な着陸
        if (updatedAircraft.position instanceof Vector3) {
          // 機体タイプに応じた最低高度を設定
          const minHeight = aircraft.type === 'cessna172' ? 2.5 : 
                           aircraft.type === 'boeing737' ? 8.0 : 4.0;
          updatedAircraft.position.y = Math.max(minHeight, updatedAircraft.position.y);
        }
        if (updatedAircraft.velocity instanceof Vector3) {
          updatedAircraft.velocity.y = Math.max(0, updatedAircraft.velocity.y);
          
          // 地上での摩擦（最適化: ベクトル操作を効率化）
          const frictionFactor = controls.brakes ? 0.95 : 0.99;
          updatedAircraft.velocity.multiplyScalar(frictionFactor);
        }
      } else {
        // 墜落
        console.log('Crash detected!');
      }
    }
    
    // 失速チェック（最適化: 低速時のみ頻繁にチェック）
    let shouldCheckStall = aircraft.airspeed < 150; // 低速時は常にチェック
    if (!shouldCheckStall && currentTime - lastStallCheck.current > 1000) {
      shouldCheckStall = true; // 高速時は1秒間隔
      lastStallCheck.current = currentTime;
    }
    
    if (shouldCheckStall) {
      const mergedAircraft = { ...aircraft, ...updatedAircraft };
      if (checkStall(mergedAircraft)) {
        // 失速時の処理
        if (store.gameSettings.assists.stallWarning) {
          // 警告音を再生
          audioSystem.playWarningSound('stall');
        }
      }
    }
    
    // 地形接近警告
    if (aircraft.altitude < 100 && aircraft.verticalSpeed < -5) {
      if (store.gameSettings.assists.collisionWarning) {
        audioSystem.playWarningSound('terrain');
        // ATC警告メッセージ
        audioSystem.addATCMessage("TERRAIN! PULL UP! TERRAIN!", 'emergency');
      }
    }
    
    // 低高度警告
    if (aircraft.altitude < 300 && aircraft.altitude > 100 && aircraft.verticalSpeed < -2) {
      if (frameCount.current % 120 === 0) { // 2秒間隔で警告
        audioSystem.playWarningSound('altitude');
      }
    }
    
    // 高度な空力警告の処理
    if (advancedAero.warnings.length > 0) {
      advancedAero.warnings.forEach(warning => {
        if (warning.includes('STALL') && frameCount.current % 60 === 0) {
          audioSystem.playWarningSound('stall');
          audioSystem.addATCMessage(warning, 'high');
        } else if (warning.includes('SPIN') && frameCount.current % 30 === 0) {
          audioSystem.addATCMessage(warning, 'emergency');
        } else if (warning.includes('HIGH G-FORCE') && frameCount.current % 90 === 0) {
          audioSystem.addATCMessage("Reduce G-force! Risk of G-LOC!", 'high');
        }
      });
    }
    
    // スピン回復の音声ガイダンス
    if (advancedAero.state.spinRecovery.required && frameCount.current % 180 === 0) { // 3秒間隔
      audioSystem.addATCMessage(`Spin recovery: ${advancedAero.state.spinRecovery.technique}`, 'emergency');
    }
    
    // キャッシュ更新
    cache.lastAircraft = { ...aircraft };
    cache.lastControls = { ...controls };
    cache.lastWeather = { ...weather };
    cache.canSkipUpdate = false;
    
    // 状態の更新
    store.setAircraft(updatedAircraft);
    store.updateSimulationTime(clampedDelta);
    
    // パフォーマンス監視終了
    performanceMonitor.endFrame(state.gl.info?.render ? state.gl : null);
  });
};
