import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';
import { useSimulatorStore } from '@/store/simulatorStore';

export const F16: React.FC = () => {
  const groupRef = useRef<Group>(null);
  const afterburnerRef = useRef<Mesh>(null);
  
  const { aircraft } = useSimulatorStore();
  
  // アフターバーナーのアニメーション
  useFrame((state, delta) => {
    if (afterburnerRef.current && aircraft.throttle > 0.8) {
      const flameScale = 1 + Math.sin(Date.now() * 0.02) * 0.3;
      afterburnerRef.current.scale.x = afterburnerRef.current.scale.y = flameScale;
      afterburnerRef.current.scale.z = flameScale * (aircraft.throttle - 0.8) * 5;
    }
  });
  
  // 航空機の位置と回転を更新
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(aircraft.position);
      groupRef.current.rotation.copy(aircraft.rotation);
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* 機首（円錐形 - 尖った部分が前方向） */}
      <mesh position={[0, 0, -8]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[1.2, 4, 12]} />
        <meshStandardMaterial color="#4A5568" metalness={0.85} roughness={0.15} />
      </mesh>
      
      {/* 前部胴体 */}
      <mesh position={[0, 0, -4]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 2, 4]} />
        <meshStandardMaterial color="#4A5568" metalness={0.85} roughness={0.15} />
      </mesh>
      
      {/* 中央胴体 */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 2.4, 6]} />
        <meshStandardMaterial color="#4A5568" metalness={0.85} roughness={0.15} />
      </mesh>
      
      {/* 後部胴体 */}
      <mesh position={[0, 0, 5]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 2, 4]} />
        <meshStandardMaterial color="#4A5568" metalness={0.85} roughness={0.15} />
      </mesh>
      
      {/* キャノピー */}
      <mesh position={[0, 1.5, -3]} castShadow>
        <sphereGeometry args={[1, 16, 8, 0, Math.PI, 0, Math.PI / 2]} />
        <meshStandardMaterial 
          color="#1E40AF" 
          metalness={0.2} 
          roughness={0.1} 
          opacity={0.85} 
          transparent 
        />
      </mesh>
      
      {/* 主翼 */}
      <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 0.3, 6]} />
        <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* 垂直尾翼 */}
      <mesh position={[0, 3, 6]} castShadow>
        <boxGeometry args={[0.3, 6, 3]} />
        <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* 水平尾翼 */}
      <mesh position={[0, 0, 6]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.2, 2.5]} />
        <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* エンジンインテーク（腹部） */}
      <mesh position={[0, -1.2, -2]} castShadow>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color="#1A202C" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* エンジンノズル（後方向） */}
      <mesh position={[0, 0, 7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="#1A202C" metalness={0.95} roughness={0.05} />
      </mesh>
      
      {/* アフターバーナー（後方向） */}
      <mesh ref={afterburnerRef} position={[0, 0, 8.5]} rotation={[Math.PI / 2, 0, 0]} visible={aircraft.throttle > 0.8}>
        <coneGeometry args={[0.8, 3, 12]} />
        <meshStandardMaterial 
          color="#FF4500" 
          emissive="#FF6B00" 
          emissiveIntensity={3}
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* アフターバーナーの光 */}
      {aircraft.throttle > 0.8 && (
        <pointLight 
          position={[0, 0, 9]} 
          color="#FF6B00" 
          intensity={aircraft.throttle * 10} 
          distance={40} 
        />
      )}
      
      {/* 翼端ミサイル（AIM-9） */}
      <group position={[6, -0.3, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.15, 2, 4, 8]} />
          <meshStandardMaterial color="#E5E7EB" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -1.2]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.15, 0.4, 8]} />
          <meshStandardMaterial color="#DC2626" />
        </mesh>
      </group>
      <group position={[-6, -0.3, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.15, 2, 4, 8]} />
          <meshStandardMaterial color="#E5E7EB" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -1.2]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.15, 0.4, 8]} />
          <meshStandardMaterial color="#DC2626" />
        </mesh>
      </group>
      
      {/* ランディングギア（条件付き表示） */}
      {aircraft.landingGear && (
        <>
          {/* 前輪 */}
          <group position={[0, -1.8, -4]}>
            <mesh castShadow>
              <boxGeometry args={[0.2, 1.8, 0.2]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
            <mesh position={[0, -0.9, 0]} castShadow rotation={[0, Math.PI / 2, Math.PI / 2]}>
              <torusGeometry args={[0.3, 0.1, 8, 16]} />
              <meshStandardMaterial color="#1F2937" />
            </mesh>
          </group>
          
          {/* 主輪（左） */}
          <group position={[-2, -1.8, 1]}>
            <mesh castShadow>
              <boxGeometry args={[0.25, 1.8, 0.25]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
            <mesh position={[0, -0.9, 0]} castShadow rotation={[0, Math.PI / 2, Math.PI / 2]}>
              <torusGeometry args={[0.4, 0.15, 8, 16]} />
              <meshStandardMaterial color="#1F2937" />
            </mesh>
          </group>
          
          {/* 主輪（右） */}
          <group position={[2, -1.8, 1]}>
            <mesh castShadow>
              <boxGeometry args={[0.25, 1.8, 0.25]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
            <mesh position={[0, -0.9, 0]} castShadow rotation={[0, Math.PI / 2, Math.PI / 2]}>
              <torusGeometry args={[0.4, 0.15, 8, 16]} />
              <meshStandardMaterial color="#1F2937" />
            </mesh>
          </group>
        </>
      )}
      
      {/* エアブレーキ（展開時） */}
      {aircraft.brakes && aircraft.altitude > 10 && (
        <mesh position={[0, 2, 2]} rotation={[-Math.PI / 3, 0, 0]} castShadow>
          <boxGeometry args={[2.5, 0.1, 1.5]} />
          <meshStandardMaterial color="#DC2626" />
        </mesh>
      )}
      
      {/* ナビゲーションライト */}
      <pointLight position={[-6, 0, 0]} color="#FF0000" intensity={1} distance={30} />
      <pointLight position={[6, 0, 0]} color="#00FF00" intensity={1} distance={30} />
      <pointLight position={[0, 3, 6]} color="#FFFFFF" intensity={1} distance={30} />
      
      {/* ストロボライト */}
      <pointLight 
        position={[0, -0.5, 0]} 
        color="#FFFFFF" 
        intensity={Math.sin(Date.now() * 0.01) > 0.9 ? 8 : 0} 
        distance={100} 
      />
    </group>
  );
};