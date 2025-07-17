'use client';

import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useSimulatorStore } from '@/store/simulatorStore';
import { updateAircraftPhysics, checkStall, checkGroundCollision, calculateAutopilotControls } from '@/physics/aerodynamics';

export const usePhysicsUpdate = () => {
  const store = useSimulatorStore();
  
  useFrame((state, delta) => {
    // ポーズ中は物理演算を停止
    if (store.isPaused) return;
    
    // タイムステップを制限（大きすぎると不安定）
    const clampedDelta = Math.min(delta, 0.02); // 最大50fps相当
    
    const { aircraft, controls, weather } = store;
    
    // aircraftが無効な場合はスキップ
    if (!aircraft || !aircraft.type) {
      console.warn('Invalid aircraft state in usePhysicsUpdate');
      return;
    }
    
    // オートパイロットが有効な場合のコントロール調整
    let effectiveControls = { ...controls };
    if (controls.autopilot) {
      const autopilotControls = calculateAutopilotControls(
        aircraft,
        1000, // 目標高度（仮）
        aircraft.heading // 現在の方位を維持
      );
      effectiveControls = { ...effectiveControls, ...autopilotControls };
    }
    
    // 物理演算の更新
    const updatedAircraft = updateAircraftPhysics(
      aircraft,
      effectiveControls,
      weather,
      clampedDelta
    );
    
    // 地面衝突チェック
    const tempAircraft = { ...aircraft, ...updatedAircraft };
    if (checkGroundCollision(tempAircraft)) {
      // 着陸または墜落の処理
      if (aircraft.landingGear && aircraft.airspeed < 200) {
        // 安全な着陸
        if (updatedAircraft.position instanceof Vector3) {
          updatedAircraft.position.y = Math.max(0, updatedAircraft.position.y);
        }
        if (updatedAircraft.velocity instanceof Vector3) {
          updatedAircraft.velocity.y = Math.max(0, updatedAircraft.velocity.y);
          
          // 地上での摩擦
          if (controls.brakes) {
            updatedAircraft.velocity.multiplyScalar(0.95);
          } else {
            updatedAircraft.velocity.multiplyScalar(0.99);
          }
        }
      } else {
        // 墜落
        console.log('Crash detected!');
        // ここで墜落処理を実装（ゲームオーバーなど）
      }
    }
    
    // 失速チェック
    const mergedAircraft = { ...aircraft, ...updatedAircraft };
    if (checkStall(mergedAircraft)) {
      // 失速時の処理（機首下げなど）
      if (store.gameSettings.assists.stallWarning) {
        // 警告は HUD で表示される
      }
    }
    
    // 状態の更新
    store.setAircraft(updatedAircraft);
    store.updateSimulationTime(clampedDelta);
  });
};
