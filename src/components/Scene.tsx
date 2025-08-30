'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Cessna172 } from '@/components/aircraft/Cessna172';
import { Boeing737 } from '@/components/aircraft/Boeing737';
import { F16 } from '@/components/aircraft/F16';
import { Terrain } from '@/components/environment/Terrain';
import { Sky } from '@/components/environment/Sky';
import { CameraController } from '@/components/CameraController';
import { usePhysicsUpdate } from '@/hooks/usePhysicsUpdate';
import { useSimulatorStore } from '@/store/simulatorStore';
import { performanceMonitor } from '@/utils/performance';
import { memoryManager, startMemoryManagement } from '@/utils/memoryOptimization';
import { AutoLODManager, TerrainLOD, LODDebugInfo } from '@/components/optimization/LODSystem';

// 物理演算フックを使用するコンポーネント
const PhysicsUpdater: React.FC = () => {
  usePhysicsUpdate();
  return null;
};

export const Scene: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { aircraft, gameSettings } = useSimulatorStore();
  const cameraRef = useRef<THREE.Camera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const [cameraPosition, setCameraPosition] = useState(new THREE.Vector3(20, 10, 20));
  
  useEffect(() => {
    setMounted(true);
    
    // メモリ管理とパフォーマンス監視を開始
    startMemoryManagement(5000); // 5秒間隔
    
    // パフォーマンス設定を初期化
    performanceMonitor.updateConfig({
      targetFPS: 60,
      memoryWarningThreshold: 200,
      autoOptimize: true
    });
    
    return () => {
      // クリーンアップ
      memoryManager.cleanup();
    };
  }, []);
  
  // カメラ位置の更新
  useEffect(() => {
    const updateCameraPosition = () => {
      if (cameraRef.current) {
        setCameraPosition(cameraRef.current.position.clone());
      }
    };
    
    // RAF で更新頻度を制限
    const rafId = requestAnimationFrame(updateCameraPosition);
    return () => cancelAnimationFrame(rafId);
  }, []);
  
  // パフォーマンスベースのグラフィック設定調整
  const getOptimizedSettings = () => {
    const avgFps = performanceMonitor.getAverageFPS();
    const memoryUsage = memoryManager.getTotalMemoryUsage() / (1024 * 1024); // MB
    
    let adjustedGraphics = gameSettings.graphics;
    let shadowMapSize = {
      low: 512,
      medium: 1024,
      high: 2048,
      ultra: 4096,
    }[gameSettings.graphics];
    
    // 自動品質調整
    if (avgFps < 30 || memoryUsage > 200) {
      adjustedGraphics = 'low';
      shadowMapSize = 256;
    } else if (avgFps < 45) {
      adjustedGraphics = 'medium';
      shadowMapSize = 512;
    }
    
    return { graphics: adjustedGraphics, shadowMapSize };
  };
  
  const optimizedSettings = getOptimizedSettings();
  
  if (!mounted) {
    return null;
  }
  
  return (
    <Canvas
      shadows={optimizedSettings.graphics !== 'low'}
      camera={{ 
        fov: 75, 
        near: 0.1, 
        far: optimizedSettings.graphics === 'low' ? 10000 : 50000,
        position: [20, 10, 20] 
      }}
      gl={{
        antialias: optimizedSettings.graphics === 'high' || optimizedSettings.graphics === 'ultra',
        powerPreference: 'high-performance',
        stencil: false, // パフォーマンス向上
        depth: true,
        alpha: false // 背景透明不要
      }}
      onCreated={({ gl, camera }) => {
        // レンダラーの最適化設定
        rendererRef.current = gl;
        cameraRef.current = camera;
        
        // シャドウ設定
        if (optimizedSettings.graphics !== 'low') {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = optimizedSettings.graphics === 'ultra' 
            ? THREE.PCFSoftShadowMap 
            : THREE.PCFShadowMap;
          gl.shadowMap.autoUpdate = false; // 手動更新でパフォーマンス向上
        }
        
        // カラーマネジメント
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        
        // ピクセル比の調整
        const pixelRatio = Math.min(window.devicePixelRatio, optimizedSettings.graphics === 'ultra' ? 2 : 1.5);
        gl.setPixelRatio(pixelRatio);
        
        // パフォーマンス監視にレンダラー情報を登録
        performanceMonitor.endFrame(gl);
      }}
    >
      {/* 自動LOD管理システム */}
      <AutoLODManager cameraPosition={cameraPosition} enabled={true}>
        {/* 物理演算の更新 */}
        <PhysicsUpdater />
        
        {/* カメラコントローラー */}
        <CameraController />
        
        {/* 環境 - LOD対応 */}
        <Sky />
        
        {/* 地形LODシステム（デバッグ用に無効化） */}
        {false && <TerrainLOD
          size={2000}
          segments={[256, 128, 64, 32]}
          cameraPosition={cameraPosition}
        />}
        
        {/* 通常の地形を使用 */}
        <Terrain />
        
        {/* 航空機 */}
        {aircraft.type === 'boeing737' ? (
          <Boeing737 />
        ) : aircraft.type === 'f16' ? (
          <F16 />
        ) : (
          <Cessna172 />
        )}
        
        {/* パフォーマンス最適化されたライティング */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[100, 100, 50]}
          intensity={1.0}
          castShadow={optimizedSettings.graphics !== 'low'}
          shadow-mapSize-width={optimizedSettings.shadowMapSize}
          shadow-mapSize-height={optimizedSettings.shadowMapSize}
          shadow-camera-far={1000}
          shadow-camera-left={-200}
          shadow-camera-right={200}
          shadow-camera-top={200}
          shadow-camera-bottom={-200}
        />
        
        {/* フォグ効果（遠距離オブジェクトのカリング） */}
        <fog attach="fog" args={['#87CEEB', 1000, optimizedSettings.graphics === 'low' ? 5000 : 20000]} />
      </AutoLODManager>
      
      {/* デバッグ情報は削除 */}
    </Canvas>
  );
};
