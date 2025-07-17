import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, BoxGeometry, CylinderGeometry, Vector3 } from 'three';
import { useSimulatorStore } from '@/store/simulatorStore';

export const Cessna172: React.FC = () => {
  const groupRef = useRef<Group>(null);
  const propellerRef = useRef<Mesh>(null);
  
  const { aircraft } = useSimulatorStore();
  
  // プロペラの回転
  useFrame((state, delta) => {
    if (propellerRef.current && aircraft.engineRPM > 0) {
      propellerRef.current.rotation.z += (aircraft.engineRPM / 60) * delta * Math.PI * 2;
    }
  });
  
  // 航空機の位置と回転を更新
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(aircraft.position);
      groupRef.current.rotation.copy(aircraft.rotation);
    }
  });
  
  // 簡略化されたセスナ172のジオメトリ
  const fuselageGeometry = useMemo(() => new BoxGeometry(1, 1, 8), []);
  const wingGeometry = useMemo(() => new BoxGeometry(12, 0.3, 2), []);
  const tailGeometry = useMemo(() => new BoxGeometry(0.3, 2, 1), []);
  const propellerGeometry = useMemo(() => new BoxGeometry(3, 0.1, 0.3), []);
  const wheelGeometry = useMemo(() => new CylinderGeometry(0.3, 0.3, 0.2, 16), []);
  
  return (
    <group ref={groupRef}>
      {/* 胴体 */}
      <mesh geometry={fuselageGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* 主翼 */}
      <mesh geometry={wingGeometry} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#ff0000" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* 水平尾翼 */}
      <mesh geometry={new BoxGeometry(3, 0.2, 1)} position={[0, 0, 3.5]} castShadow>
        <meshStandardMaterial color="#ff0000" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* 垂直尾翼 */}
      <mesh geometry={tailGeometry} position={[0, 0.8, 3.5]} castShadow>
        <meshStandardMaterial color="#ff0000" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* プロペラ */}
      <mesh ref={propellerRef} geometry={propellerGeometry} position={[0, 0, -4.2]} castShadow>
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* エンジンカウリング */}
      <mesh geometry={new CylinderGeometry(0.6, 0.5, 1.5, 8)} position={[0, 0, -3.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial color="#666666" metalness={0.4} roughness={0.6} />
      </mesh>
      
      {/* ランディングギア（条件付き表示） */}
      {aircraft.landingGear && (
        <>
          {/* 前輪 */}
          <group position={[0, -0.8, -2]}>
            <mesh geometry={new BoxGeometry(0.1, 0.8, 0.1)} position={[0, -0.4, 0]} castShadow>
              <meshStandardMaterial color="#333333" />
            </mesh>
            <mesh geometry={wheelGeometry} position={[0, -0.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <meshStandardMaterial color="#222222" />
            </mesh>
          </group>
          
          {/* 主輪（左） */}
          <group position={[-1.5, -0.8, 0]}>
            <mesh geometry={new BoxGeometry(0.1, 0.8, 0.1)} position={[0, -0.4, 0]} castShadow>
              <meshStandardMaterial color="#333333" />
            </mesh>
            <mesh geometry={wheelGeometry} position={[0, -0.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <meshStandardMaterial color="#222222" />
            </mesh>
          </group>
          
          {/* 主輪（右） */}
          <group position={[1.5, -0.8, 0]}>
            <mesh geometry={new BoxGeometry(0.1, 0.8, 0.1)} position={[0, -0.4, 0]} castShadow>
              <meshStandardMaterial color="#333333" />
            </mesh>
            <mesh geometry={wheelGeometry} position={[0, -0.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <meshStandardMaterial color="#222222" />
            </mesh>
          </group>
        </>
      )}
      
      {/* コックピット窓 */}
      <mesh geometry={new BoxGeometry(0.8, 0.8, 1.5)} position={[0, 0.3, -1]} castShadow>
        <meshStandardMaterial color="#333366" metalness={0.1} roughness={0.1} opacity={0.7} transparent />
      </mesh>
      
      {/* フラップ（アニメーション付き） */}
      <mesh 
        geometry={new BoxGeometry(4, 0.1, 0.8)} 
        position={[-4, -0.2, 0.8]} 
        rotation={[aircraft.flaps * Math.PI / 180, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color="#cc0000" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh 
        geometry={new BoxGeometry(4, 0.1, 0.8)} 
        position={[4, -0.2, 0.8]} 
        rotation={[aircraft.flaps * Math.PI / 180, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color="#cc0000" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* ナビゲーションライト */}
      <pointLight position={[-6, 0, 0]} color="#ff0000" intensity={0.5} distance={10} />
      <pointLight position={[6, 0, 0]} color="#00ff00" intensity={0.5} distance={10} />
      <pointLight position={[0, 0.8, 3.5]} color="#ffffff" intensity={0.5} distance={10} />
      
      {/* ランディングライト（着陸装置展開時） */}
      {aircraft.landingGear && (
        <>
          <spotLight
            position={[0, -0.5, -3]}
            target-position={[0, -5, -10]}
            angle={0.3}
            penumbra={0.5}
            intensity={1}
            color="#ffffff"
            castShadow
          />
        </>
      )}
    </group>
  );
};
