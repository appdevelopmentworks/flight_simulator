'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Cessna172 } from '@/components/aircraft/Cessna172';
import { Boeing737 } from '@/components/aircraft/Boeing737';
import { F16 } from '@/components/aircraft/F16';
import { Terrain } from '@/components/environment/Terrain';
import { Sky } from '@/components/environment/Sky';
import { CameraController } from '@/components/CameraController';
import { usePhysicsUpdate } from '@/hooks/usePhysicsUpdate';
import { useSimulatorStore } from '@/store/simulatorStore';

// 物理演算フックを使用するコンポーネント
const PhysicsUpdater: React.FC = () => {
  usePhysicsUpdate();
  return null;
};

export const Scene: React.FC = () => {
  const { aircraft, gameSettings } = useSimulatorStore();
  
  // グラフィック設定に基づくシャドウマップサイズ
  const shadowMapSize = {
    low: 512,
    medium: 1024,
    high: 2048,
    ultra: 4096,
  }[gameSettings.graphics];
  
  return (
    <Canvas
      shadows
      camera={{ 
        fov: 75, 
        near: 0.1, 
        far: 50000,
        position: [20, 10, 20] 
      }}
      gl={{
        antialias: gameSettings.graphics !== 'low',
        shadowMap: {
          enabled: true,
          type: THREE.PCFSoftShadowMap,
        },
      }}
    >
      {/* 物理演算の更新 */}
      <PhysicsUpdater />
      
      {/* カメラコントローラー */}
      <CameraController />
      
      {/* 環境 */}
      <Sky />
      <Terrain />
      
      {/* 航空機 */}
      {aircraft.type === 'boeing737' ? (
        <Boeing737 />
      ) : aircraft.type === 'f16' ? (
        <F16 />
      ) : (
        <Cessna172 />
      )}
      
      {/* パフォーマンスモニター（開発用） */}
      {process.env.NODE_ENV === 'development' && (
        <group>
          {/* Stats.js などのパフォーマンスモニターをここに追加 */}
        </group>
      )}
    </Canvas>
  );
};
