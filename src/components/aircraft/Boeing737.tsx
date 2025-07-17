import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';
import { useSimulatorStore } from '@/store/simulatorStore';

export const Boeing737: React.FC = () => {
  const groupRef = useRef<Group>(null);
  const engine1Ref = useRef<Mesh>(null);
  const engine2Ref = useRef<Mesh>(null);
  
  const { aircraft } = useSimulatorStore();
  
  // エンジンのファンアニメーション
  useFrame((state, delta) => {
    if (engine1Ref.current && aircraft.engineRPM > 0) {
      const fanSpeed = (aircraft.engineRPM / 100) * delta * Math.PI * 20;
      engine1Ref.current.rotation.z += fanSpeed;
    }
    if (engine2Ref.current && aircraft.engineRPM > 0) {
      const fanSpeed = (aircraft.engineRPM / 100) * delta * Math.PI * 20;
      engine2Ref.current.rotation.z += fanSpeed;
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
      {/* メイン胴体（前部） */}
      <mesh position={[0, 0, -10]} castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 20, 32]} />
        <meshStandardMaterial color="#F8F8F8" metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* メイン胴体（中央部） */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 16, 32]} />
        <meshStandardMaterial color="#F8F8F8" metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* メイン胴体（後部） */}
      <mesh position={[0, 0, 12]} castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.5, 2.2, 16, 32]} />
        <meshStandardMaterial color="#F8F8F8" metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* 機首（ノーズコーン） */}
      <mesh position={[0, 0, -21]} castShadow rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[2.5, 4, 32]} />
        <meshStandardMaterial color="#F8F8F8" metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* テールコーン */}
      <mesh position={[0, 0, 20]} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[2.2, 3, 32]} />
        <meshStandardMaterial color="#F8F8F8" metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* 胴体のウィンドウライン */}
      <mesh position={[0, 0.8, -10]} castShadow>
        <boxGeometry args={[0.1, 0.8, 18]} />
        <meshStandardMaterial color="#1F2937" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* 胴体のブルーライン（装飾） */}
      <mesh position={[0, 0, 0]} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.55, 2.55, 40, 32, 1, true]} />
        <meshStandardMaterial color="#005DAA" metalness={0.8} roughness={0.1} opacity={0.3} transparent />
      </mesh>
      
      {/* コックピットウィンドウ */}
      <mesh position={[0, 1.8, -19]} castShadow>
        <boxGeometry args={[3.5, 1.2, 0.1]} />
        <meshStandardMaterial color="#1A1A1A" metalness={0.9} roughness={0.05} opacity={0.8} transparent />
      </mesh>
      <mesh position={[1.5, 1.5, -18.5]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 0.1]} />
        <meshStandardMaterial color="#1A1A1A" metalness={0.9} roughness={0.05} opacity={0.8} transparent />
      </mesh>
      <mesh position={[-1.5, 1.5, -18.5]} rotation={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 0.1]} />
        <meshStandardMaterial color="#1A1A1A" metalness={0.9} roughness={0.05} opacity={0.8} transparent />
      </mesh>
      
      {/* 主翼 */}
      <mesh position={[0, -0.5, -2]} castShadow receiveShadow>
        <boxGeometry args={[35, 0.8, 7]} />
        <meshStandardMaterial color="#F8F8F8" metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* 翼の前縁 */}
      <mesh position={[0, -0.5, -5.5]} castShadow>
        <boxGeometry args={[35, 0.6, 0.5]} />
        <meshStandardMaterial color="#E5E7EB" metalness={0.8} roughness={0.1} />
      </mesh>
      
      {/* ウィングレット（左） */}
      <mesh position={[-17.5, 1.5, -2]} rotation={[0, 0, 0.25]} castShadow>
        <boxGeometry args={[0.4, 4, 2.5]} />
        <meshStandardMaterial color="#005DAA" metalness={0.8} roughness={0.1} />
      </mesh>
      
      {/* ウィングレット（右） */}
      <mesh position={[17.5, 1.5, -2]} rotation={[0, 0, -0.25]} castShadow>
        <boxGeometry args={[0.4, 4, 2.5]} />
        <meshStandardMaterial color="#005DAA" metalness={0.8} roughness={0.1} />
      </mesh>
      
      {/* 水平尾翼 */}
      <mesh position={[0, 1, 18]} castShadow receiveShadow>
        <boxGeometry args={[13, 0.5, 4.5]} />
        <meshStandardMaterial color="#F8F8F8" metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* 垂直尾翼 */}
      <mesh position={[0, 5, 18]} castShadow>
        <boxGeometry args={[0.8, 10, 5.5]} />
        <meshStandardMaterial color="#F8F8F8" metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* 垂直尾翼の装飾 */}
      <mesh position={[0.45, 7, 17]} castShadow>
        <boxGeometry args={[0.1, 4, 3]} />
        <meshStandardMaterial color="#005DAA" metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[-0.45, 7, 17]} castShadow>
        <boxGeometry args={[0.1, 4, 3]} />
        <meshStandardMaterial color="#005DAA" metalness={0.8} roughness={0.1} />
      </mesh>
      
      {/* エンジン1（左） */}
      <group position={[-8, -2, -4]}>
        {/* パイロン */}
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[0.8, 2, 2]} />
          <meshStandardMaterial color="#9CA3AF" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* ナセル */}
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.2, 1.8, 7, 24]} />
          <meshStandardMaterial color="#E5E7EB" metalness={0.8} roughness={0.1} />
        </mesh>
        {/* インテーク */}
        <mesh position={[0, 0, -3.5]} castShadow>
          <torusGeometry args={[2, 0.3, 8, 24]} />
          <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.05} />
        </mesh>
        {/* ファンブレード */}
        <mesh ref={engine1Ref} position={[0, 0, -3]} castShadow>
          <cylinderGeometry args={[1.8, 1.8, 0.3, 12]} />
          <meshStandardMaterial color="#1F2937" metalness={0.95} roughness={0.05} />
        </mesh>
        {/* エキゾースト */}
        <mesh position={[0, 0, 3.5]} castShadow rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[1.8, 1, 16]} />
          <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
      
      {/* エンジン2（右） */}
      <group position={[8, -2, -4]}>
        {/* パイロン */}
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[0.8, 2, 2]} />
          <meshStandardMaterial color="#9CA3AF" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* ナセル */}
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.2, 1.8, 7, 24]} />
          <meshStandardMaterial color="#E5E7EB" metalness={0.8} roughness={0.1} />
        </mesh>
        {/* インテーク */}
        <mesh position={[0, 0, -3.5]} castShadow>
          <torusGeometry args={[2, 0.3, 8, 24]} />
          <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.05} />
        </mesh>
        {/* ファンブレード */}
        <mesh ref={engine2Ref} position={[0, 0, -3]} castShadow>
          <cylinderGeometry args={[1.8, 1.8, 0.3, 12]} />
          <meshStandardMaterial color="#1F2937" metalness={0.95} roughness={0.05} />
        </mesh>
        {/* エキゾースト */}
        <mesh position={[0, 0, 3.5]} castShadow rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[1.8, 1, 16]} />
          <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
      
      {/* ランディングギア（条件付き表示） */}
      {aircraft.landingGear && (
        <>
          {/* 前輪 */}
          <group position={[0, -3, -16]}>
            <mesh castShadow>
              <boxGeometry args={[0.3, 3, 0.3]} />
              <meshStandardMaterial color="#4B5563" />
            </mesh>
            <mesh position={[0, -1.5, 0]} castShadow rotation={[0, Math.PI / 2, Math.PI / 2]}>
              <torusGeometry args={[0.5, 0.2, 8, 16]} />
              <meshStandardMaterial color="#1F2937" />
            </mesh>
            <mesh position={[0, -1.5, 0.8]} castShadow rotation={[0, Math.PI / 2, Math.PI / 2]}>
              <torusGeometry args={[0.5, 0.2, 8, 16]} />
              <meshStandardMaterial color="#1F2937" />
            </mesh>
          </group>
          
          {/* 主輪（左） */}
          <group position={[-3, -3, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.4, 3, 0.4]} />
              <meshStandardMaterial color="#4B5563" />
            </mesh>
            <mesh position={[-0.6, -1.5, 0]} castShadow rotation={[0, Math.PI / 2, Math.PI / 2]}>
              <torusGeometry args={[0.6, 0.25, 8, 16]} />
              <meshStandardMaterial color="#1F2937" />
            </mesh>
            <mesh position={[0.6, -1.5, 0]} castShadow rotation={[0, Math.PI / 2, Math.PI / 2]}>
              <torusGeometry args={[0.6, 0.25, 8, 16]} />
              <meshStandardMaterial color="#1F2937" />
            </mesh>
          </group>
          
          {/* 主輪（右） */}
          <group position={[3, -3, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.4, 3, 0.4]} />
              <meshStandardMaterial color="#4B5563" />
            </mesh>
            <mesh position={[-0.6, -1.5, 0]} castShadow rotation={[0, Math.PI / 2, Math.PI / 2]}>
              <torusGeometry args={[0.6, 0.25, 8, 16]} />
              <meshStandardMaterial color="#1F2937" />
            </mesh>
            <mesh position={[0.6, -1.5, 0]} castShadow rotation={[0, Math.PI / 2, Math.PI / 2]}>
              <torusGeometry args={[0.6, 0.25, 8, 16]} />
              <meshStandardMaterial color="#1F2937" />
            </mesh>
          </group>
        </>
      )}
      
      {/* フラップ（アニメーション付き） */}
      <mesh 
        position={[-12, -0.9, 1.5]} 
        rotation={[aircraft.flaps * Math.PI / 180, 0, 0]}
        castShadow
      >
        <boxGeometry args={[8, 0.3, 2.5]} />
        <meshStandardMaterial color="#D1D5DB" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh 
        position={[12, -0.9, 1.5]} 
        rotation={[aircraft.flaps * Math.PI / 180, 0, 0]}
        castShadow
      >
        <boxGeometry args={[8, 0.3, 2.5]} />
        <meshStandardMaterial color="#D1D5DB" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* スポイラー（エアブレーキ） */}
      {aircraft.brakes && aircraft.altitude > 10 && (
        <>
          <mesh position={[-12, 0.5, -2]} rotation={[-Math.PI / 3, 0, 0]} castShadow>
            <boxGeometry args={[8, 0.2, 1.5]} />
            <meshStandardMaterial color="#EF4444" metalness={0.8} roughness={0.1} />
          </mesh>
          <mesh position={[12, 0.5, -2]} rotation={[-Math.PI / 3, 0, 0]} castShadow>
            <boxGeometry args={[8, 0.2, 1.5]} />
            <meshStandardMaterial color="#EF4444" metalness={0.8} roughness={0.1} />
          </mesh>
        </>
      )}
      
      {/* ナビゲーションライト */}
      <pointLight position={[-17.5, 0, -2]} color="#FF0000" intensity={1} distance={30} />
      <pointLight position={[17.5, 0, -2]} color="#00FF00" intensity={1} distance={30} />
      <pointLight position={[0, 10, 18]} color="#FFFFFF" intensity={1} distance={30} />
      
      {/* アンチコリジョンライト（ビーコン） */}
      <pointLight 
        position={[0, 2.5, 0]} 
        color="#FF0000" 
        intensity={Math.sin(Date.now() * 0.005) > 0 ? 2 : 0} 
        distance={40} 
      />
      <pointLight 
        position={[0, -2.5, 0]} 
        color="#FF0000" 
        intensity={Math.sin(Date.now() * 0.005 + Math.PI) > 0 ? 2 : 0} 
        distance={40} 
      />
      
      {/* ストロボライト */}
      <pointLight 
        position={[-17.5, 0, -2]} 
        color="#FFFFFF" 
        intensity={Math.sin(Date.now() * 0.01) > 0.9 ? 8 : 0} 
        distance={60} 
      />
      <pointLight 
        position={[17.5, 0, -2]} 
        color="#FFFFFF" 
        intensity={Math.sin(Date.now() * 0.01 + 1) > 0.9 ? 8 : 0} 
        distance={60} 
      />
      
      {/* ランディングライト（着陸装置展開時） */}
      {aircraft.landingGear && (
        <>
          <spotLight
            position={[-8, -1, -10]}
            target-position={[-8, -10, -30]}
            angle={0.4}
            penumbra={0.4}
            intensity={5}
            color="#FFFFFF"
            castShadow
          />
          <spotLight
            position={[8, -1, -10]}
            target-position={[8, -10, -30]}
            angle={0.4}
            penumbra={0.4}
            intensity={5}
            color="#FFFFFF"
            castShadow
          />
        </>
      )}
    </group>
  );
};