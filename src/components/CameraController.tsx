import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, Camera } from 'three';
import { useSimulatorStore } from '@/store/simulatorStore';

export const CameraController: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const { aircraft, cameraView } = useSimulatorStore();
  const previousCameraView = useRef(cameraView);
  const towerCameraInitialized = useRef(false);
  
  // カメラ位置の更新
  useFrame(() => {
    if (!camera || !aircraft) return;
    
    const aircraftPos = aircraft.position.clone();
    const forward = new Vector3(0, 0, -1).applyEuler(aircraft.rotation);
    const up = new Vector3(0, 1, 0).applyEuler(aircraft.rotation);
    const right = new Vector3(1, 0, 0).applyEuler(aircraft.rotation);
    
    // カメラビューが変更された場合のみ更新
    const viewChanged = previousCameraView.current !== cameraView;
    if (viewChanged) {
      previousCameraView.current = cameraView;
      towerCameraInitialized.current = false;
    }
    
    switch (cameraView) {
      case 'cockpit':
        // コックピットビュー
        camera.position.copy(aircraftPos)
          .add(up.clone().multiplyScalar(0.5))
          .add(forward.clone().multiplyScalar(-1.5));
        camera.lookAt(
          aircraftPos.clone().add(forward.clone().multiplyScalar(10))
        );
        break;
        
      case 'external':
        // 外部追跡ビュー
        const externalOffset = new Vector3(10, 5, 10);
        camera.position.copy(aircraftPos).add(externalOffset);
        camera.lookAt(aircraftPos);
        break;
        
      case 'tower':
        // タワービュー（完全固定位置、チカチカ防止）
        if (!towerCameraInitialized.current) {
          camera.position.set(100, 60, 0);
          towerCameraInitialized.current = true;
        }
        // lookAtは毎フレーム更新（航空機を追跡）
        camera.lookAt(aircraftPos);
        break;
        
      case 'free':
        // フリーカメラ（OrbitControlsで制御）
        if (controlsRef.current) {
          controlsRef.current.target.copy(aircraftPos);
          // 初回のみカメラ位置を設定
          if (viewChanged) {
            camera.position.set(aircraftPos.x + 20, aircraftPos.y + 10, aircraftPos.z + 20);
          }
        }
        break;
    }
  });
  
  // カメラビューが変更されたときの処理
  useEffect(() => {
    if (cameraView === 'free' && controlsRef.current) {
      controlsRef.current.enabled = true;
    } else if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  }, [cameraView]);
  
  return (
    <>
      {cameraView === 'free' && (
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={500}
          maxPolarAngle={Math.PI * 0.9}
          enableDamping={true}
          dampingFactor={0.05}
        />
      )}
    </>
  );
};
