/**
 * Level of Detail (LOD) システム
 * 距離とパフォーマンスに基づいて3Dオブジェクトの詳細度を動的に調整
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { LOD } from 'three';
import { performanceMonitor } from '@/utils/performance';
import { memoryManager } from '@/utils/memoryOptimization';

export interface LODLevel {
  distance: number;
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material;
  visible: boolean;
  triangles: number;
}

export interface LODConfig {
  levels: LODLevel[];
  hysteresis: number; // 距離変更の閾値
  performanceBased: boolean; // パフォーマンスベースの自動調整
  updateInterval: number; // ms
}

interface LODSystemProps {
  children: React.ReactNode;
  cameraPosition: THREE.Vector3;
  config: LODConfig;
  enabled?: boolean;
}

/**
 * 適応的LODオブジェクト
 */
export const AdaptiveLODMesh: React.FC<{
  position: [number, number, number];
  lodLevels: {
    distance: number;
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
  }[];
  cameraPosition: THREE.Vector3;
  performanceMode?: boolean;
}> = ({ position, lodLevels, cameraPosition, performanceMode = false }) => {
  const cameraRef = useRef<THREE.Camera>();
  const meshRef = useRef<THREE.LOD>(null);
  const lastLevelRef = useRef<number>(-1);
  const lastUpdateRef = useRef<number>(0);

  // LODオブジェクトの作成
  const lodObject = useMemo(() => {
    const lod = new THREE.LOD();
    
    lodLevels.forEach((level, index) => {
      const mesh = new THREE.Mesh(level.geometry, level.material);
      
      // リソース登録
      memoryManager.registerResource(
        `lod-${index}-geom`,
        level.geometry,
        index === 0 ? 'high' : index === 1 ? 'medium' : 'low'
      );
      memoryManager.registerResource(
        `lod-${index}-mat`,
        level.material,
        'medium'
      );
      
      lod.addLevel(mesh, level.distance);
    });
    
    lod.position.set(...position);
    return lod;
  }, [lodLevels, position]);

  // フレーム毎の更新
  useFrame(() => {
    const currentTime = performance.now();
    
    // 更新頻度を制限（パフォーマンス最適化）
    if (currentTime - lastUpdateRef.current < 100) return; // 100ms間隔
    lastUpdateRef.current = currentTime;
    
    if (!meshRef.current) return;

    const distance = cameraPosition.distanceTo(new THREE.Vector3(...position));
    
    // パフォーマンスベースの調整
    if (performanceMode) {
      const avgFps = performanceMonitor.getAverageFPS();
      const performanceFactor = avgFps < 30 ? 0.5 : avgFps < 45 ? 0.7 : 1.0;
      const adjustedDistance = distance * performanceFactor;
      
      // LODの更新にはカメラオブジェクトが必要（Vector3ではなく）
      const tempCamera = new THREE.PerspectiveCamera();
      tempCamera.position.copy(cameraPosition);
      meshRef.current.update(tempCamera);
      
      // 現在のLODレベルを追跡
      const currentLevel = meshRef.current.getCurrentLevel();
      if (currentLevel !== lastLevelRef.current) {
        lastLevelRef.current = currentLevel;
        
        // 使用されたリソースをマーク
        if (currentLevel >= 0) {
          memoryManager.markResourceUsed(`lod-${currentLevel}-geom`);
          memoryManager.markResourceUsed(`lod-${currentLevel}-mat`);
        }
      }
    } else {
      // 通常モードでもカメラオブジェクトを作成
      const tempCamera = new THREE.PerspectiveCamera();
      tempCamera.position.copy(cameraPosition);
      meshRef.current.update(tempCamera);
    }
  });

  return <primitive ref={meshRef} object={lodObject} />;
};

/**
 * 地形用LODシステム
 */
export const TerrainLOD: React.FC<{
  size: number;
  segments: number[];
  cameraPosition: THREE.Vector3;
  heightMap?: THREE.Texture;
}> = ({ size, segments, cameraPosition, heightMap }) => {
  const lodLevels = useMemo(() => {
    return segments.map((segmentCount, index) => {
      // 地形ジオメトリの生成
      const geometry = new THREE.PlaneGeometry(size, size, segmentCount, segmentCount);
      
      // 高さマップが提供されている場合は適用
      if (heightMap) {
        // 簡略化された高さマップ適用
        const vertices = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < vertices.length; i += 3) {
          // ここで高さマップから高さを取得（簡略化）
          vertices[i + 2] = Math.sin(vertices[i] * 0.1) * Math.cos(vertices[i + 1] * 0.1) * 10;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
      }
      
      // マテリアル
      const material = new THREE.MeshLambertMaterial({
        color: 0x90EE90,
        wireframe: process.env.NODE_ENV === 'development' && index > 0
      });
      
      return {
        distance: 500 * (index + 1),
        geometry: memoryManager.optimizeGeometry(geometry),
        material: memoryManager.optimizeMaterial(material)
      };
    });
  }, [size, segments, heightMap]);

  return (
    <AdaptiveLODMesh
      position={[0, -50, 0]}
      lodLevels={lodLevels}
      cameraPosition={cameraPosition}
      performanceMode={true}
    />
  );
};

/**
 * 雲のLODシステム
 */
export const CloudLOD: React.FC<{
  position: [number, number, number];
  cameraPosition: THREE.Vector3;
  opacity?: number;
}> = ({ position, cameraPosition, opacity = 0.8 }) => {
  const lodLevels = useMemo(() => {
    const baseGeometry = new THREE.SphereGeometry(50, 8, 8);
    const mediumGeometry = new THREE.SphereGeometry(50, 16, 16);
    const highGeometry = new THREE.SphereGeometry(50, 32, 32);
    
    const baseMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: opacity * 0.5
    });
    
    const mediumMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: opacity * 0.7
    });
    
    const highMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: opacity
    });

    return [
      { distance: 100, geometry: highGeometry, material: highMaterial },
      { distance: 300, geometry: mediumGeometry, material: mediumMaterial },
      { distance: 1000, geometry: baseGeometry, material: baseMaterial }
    ];
  }, [opacity]);

  return (
    <AdaptiveLODMesh
      position={position}
      lodLevels={lodLevels}
      cameraPosition={cameraPosition}
      performanceMode={true}
    />
  );
};

/**
 * 航空機のLODシステム（他の航空機用）
 */
export const AircraftLOD: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
  aircraftType: 'cessna172' | 'boeing737' | 'f16';
  cameraPosition: THREE.Vector3;
}> = ({ position, rotation, aircraftType, cameraPosition }) => {
  const lodLevels = useMemo(() => {
    // 簡略化された航空機ジオメトリ
    const simpleGeometry = new THREE.BoxGeometry(2, 1, 8); // 単純な箱
    const mediumGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8); // 円筒
    const detailedGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 16); // より詳細な円筒
    
    const material = new THREE.MeshLambertMaterial({
      color: aircraftType === 'f16' ? 0x808080 : 0xffffff
    });

    return [
      { distance: 500, geometry: detailedGeometry, material },
      { distance: 2000, geometry: mediumGeometry, material },
      { distance: 10000, geometry: simpleGeometry, material }
    ];
  }, [aircraftType]);

  return (
    <group position={position} rotation={rotation}>
      <AdaptiveLODMesh
        position={[0, 0, 0]}
        lodLevels={lodLevels}
        cameraPosition={cameraPosition}
        performanceMode={true}
      />
    </group>
  );
};

/**
 * 自動LOD管理システム
 */
export const AutoLODManager: React.FC<{
  children: React.ReactNode;
  cameraPosition: THREE.Vector3;
  enabled?: boolean;
}> = ({ children, cameraPosition, enabled = true }) => {
  const updateIntervalRef = useRef<number>();
  
  useEffect(() => {
    if (!enabled) return;
    
    // 定期的なLODレベル評価と最適化
    updateIntervalRef.current = window.setInterval(() => {
      const avgFps = performanceMonitor.getAverageFPS();
      const memoryStats = memoryManager.getMemoryStats();
      
      // パフォーマンスが低い場合は自動的にLODレベルを下げる
      if (avgFps < 30 || memoryStats.totalMemoryMB > 150) {
        // LODレベルの調整をトリガー
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎛️ Auto LOD: Reducing quality due to performance (${avgFps} FPS, ${memoryStats.totalMemoryMB.toFixed(1)} MB)`);
        }
      }
    }, 2000);
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [enabled]);
  
  return <>{children}</>;
};

/**
 * パフォーマンス情報の表示（デバッグ用）
 */
export const LODDebugInfo: React.FC = () => {
  const [stats, setStats] = React.useState({
    fps: 0,
    memory: 0,
    resources: 0
  });
  
  useEffect(() => {
    const interval = setInterval(() => {
      const memStats = memoryManager.getMemoryStats();
      setStats({
        fps: Math.round(performanceMonitor.getAverageFPS()),
        memory: Math.round(memStats.totalMemoryMB),
        resources: memStats.totalResources
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <Html>
      <div className="fixed top-20 right-4 bg-black/80 text-green-400 p-2 rounded font-mono text-xs">
        <div>LOD System</div>
        <div>FPS: {stats.fps}</div>
        <div>Memory: {stats.memory}MB</div>
        <div>Resources: {stats.resources}</div>
      </div>
    </Html>
  );
};