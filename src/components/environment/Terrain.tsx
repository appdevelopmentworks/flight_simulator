import React from 'react';
import { Plane } from '@react-three/drei';
import { RepeatWrapping, TextureLoader, Vector2 } from 'three';
import { useLoader } from '@react-three/fiber';

export const Terrain: React.FC = () => {
  // テクスチャは実際のプロジェクトでは適切な画像を使用
  // ここではシンプルな色のみを使用
  
  return (
    <>
      {/* 地面 */}
      <Plane
        args={[10000, 10000]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#4a5d23" roughness={0.8} metalness={0.2} />
      </Plane>
      
      {/* 滑走路 */}
      <Plane
        args={[60, 3000]}
        rotation={[-Math.PI / 2, 0, Math.PI * 0.11]} // 340度方向
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#333333" roughness={0.9} metalness={0.1} />
      </Plane>
      
      {/* 滑走路のセンターライン */}
      {Array.from({ length: 30 }).map((_, i) => (
        <Plane
          key={`centerline-${i}`}
          args={[1, 30]}
          rotation={[-Math.PI / 2, 0, Math.PI * 0.11]}
          position={[0, 0.02, -1450 + i * 100]}
          receiveShadow
        >
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
        </Plane>
      ))}
      
      {/* 滑走路端のマーキング */}
      <Plane
        args={[50, 10]}
        rotation={[-Math.PI / 2, 0, Math.PI * 0.11]}
        position={[0, 0.02, -1490]}
        receiveShadow
      >
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
      </Plane>
      
      {/* ターミナルビル（簡略化） */}
      <mesh position={[150, 15, 200]} castShadow receiveShadow>
        <boxGeometry args={[200, 30, 100]} />
        <meshStandardMaterial color="#888888" roughness={0.7} metalness={0.3} />
      </mesh>
      
      {/* 管制塔 */}
      <mesh position={[100, 25, 0]} castShadow receiveShadow>
        <boxGeometry args={[20, 50, 20]} />
        <meshStandardMaterial color="#666666" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[100, 55, 0]} castShadow>
        <boxGeometry args={[25, 10, 25]} />
        <meshStandardMaterial 
          color="#333366" 
          roughness={0.1} 
          metalness={0.1} 
          opacity={0.7} 
          transparent 
        />
      </mesh>
      
      {/* 格納庫 */}
      {[0, 1, 2].map((i) => (
        <mesh key={`hangar-${i}`} position={[-200 - i * 100, 20, 100]} castShadow receiveShadow>
          <boxGeometry args={[80, 40, 60]} />
          <meshStandardMaterial color="#777777" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
      
      {/* 誘導路 */}
      <Plane
        args={[20, 500]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[80, 0.01, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#444444" roughness={0.9} metalness={0.1} />
      </Plane>
      
      {/* 駐機場 */}
      <Plane
        args={[300, 200]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[200, 0.01, 100]}
        receiveShadow
      >
        <meshStandardMaterial color="#555555" roughness={0.85} metalness={0.15} />
      </Plane>
      
      {/* 滑走路灯火（簡略化） */}
      {Array.from({ length: 20 }).map((_, i) => (
        <React.Fragment key={`runway-light-${i}`}>
          <pointLight
            position={[-30, 0.5, -1400 + i * 150]}
            color="#ffffff"
            intensity={0.5}
            distance={20}
          />
          <pointLight
            position={[30, 0.5, -1400 + i * 150]}
            color="#ffffff"
            intensity={0.5}
            distance={20}
          />
        </React.Fragment>
      ))}
      
      {/* 進入灯 */}
      {Array.from({ length: 10 }).map((_, i) => (
        <pointLight
          key={`approach-light-${i}`}
          position={[0, 0.5 + i * 2, -1500 - i * 50]}
          color="#ffffff"
          intensity={1}
          distance={50}
        />
      ))}
      
      {/* 風向計 */}
      <group position={[150, 10, -100]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 20]} />
          <meshStandardMaterial color="#ff6600" />
        </mesh>
        <mesh position={[0, 10, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <coneGeometry args={[3, 10, 8]} />
          <meshStandardMaterial color="#ff6600" />
        </mesh>
      </group>
    </>
  );
};
