import React from 'react';
import { Sky as DreiSky, Cloud, Stars } from '@react-three/drei';
import { useSimulatorStore } from '@/store/simulatorStore';

export const Sky: React.FC = () => {
  const { weather, simulationTime } = useSimulatorStore();
  
  // 時刻に基づく太陽の位置計算（簡略化）
  const sunPosition = React.useMemo(() => {
    // 常に昼間の設定（12時頃の太陽位置）
    const hour = 12; // 固定で12時（昼間）
    const angle = (hour - 6) * 15; // 6時を0度として、1時間あたり15度
    const elevation = Math.sin((angle * Math.PI) / 180) * 90;
    const azimuth = angle;
    
    return {
      elevation: Math.max(45, elevation), // 最低でも45度の高さを保つ
      azimuth,
    };
  }, [simulationTime]);
  
  // 天候に基づく空の設定
  const skyProps = React.useMemo(() => {
    const baseProps = {
      distance: 450000,
      inclination: 0.49,
      azimuth: sunPosition.azimuth / 360,
    };
    
    switch (weather.precipitation) {
      case 'rain':
        return {
          ...baseProps,
          turbidity: 20,
          rayleigh: 0.5,
          mieCoefficient: 0.1,
          mieDirectionalG: 0.8,
        };
      case 'snow':
        return {
          ...baseProps,
          turbidity: 15,
          rayleigh: 1,
          mieCoefficient: 0.05,
          mieDirectionalG: 0.9,
        };
      default:
        return {
          ...baseProps,
          turbidity: 8,
          rayleigh: 2,
          mieCoefficient: 0.005,
          mieDirectionalG: 0.8,
        };
    }
  }, [weather.precipitation, sunPosition.azimuth]);
  
  return (
    <>
      {/* 基本的な空 */}
      <DreiSky {...skyProps} />
      
      {/* 星表示を無効化（常に昼間設定） */}
      
      {/* 雲 */}
      {weather.cloudCover > 0 && (
        <>
          {Array.from({ length: Math.floor(weather.cloudCover * 20) }).map((_, i) => (
            <Cloud
              key={`cloud-${i}`}
              position={[
                (Math.random() - 0.5) * 1000,
                200 + Math.random() * 300,
                (Math.random() - 0.5) * 1000,
              ]}
              speed={0.4}
              opacity={0.5 + weather.cloudCover * 0.5}
              scale={[
                30 + Math.random() * 20,
                10 + Math.random() * 10,
                30 + Math.random() * 20,
              ]}
            />
          ))}
        </>
      )}
      
      {/* 霧効果（視程が低い場合） */}
      {weather.visibility < 5 && (
        <fog attach="fog" args={['#cccccc', 100, weather.visibility * 1000]} />
      )}
      
      {/* 環境光 */}
      <ambientLight intensity={0.6} />
      
      {/* 太陽光 */}
      <directionalLight
        position={[
          Math.cos((sunPosition.azimuth * Math.PI) / 180) * 100,
          Math.sin((sunPosition.elevation * Math.PI) / 180) * 100,
          Math.sin((sunPosition.azimuth * Math.PI) / 180) * 100,
        ]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      
      {/* 追加の補助光（機体の視認性向上） */}
      <directionalLight
        position={[50, 80, 50]}
        intensity={0.5}
        color="#ffffff"
      />
      <directionalLight
        position={[-50, 80, -50]}
        intensity={0.5}
        color="#ffffff"
      />
    </>
  );
};
