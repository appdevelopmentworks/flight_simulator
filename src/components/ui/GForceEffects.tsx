import React, { useEffect, useState } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

export const GForceEffects: React.FC = () => {
  const { aircraft } = useSimulatorStore();
  const [blackoutOpacity, setBlackoutOpacity] = useState(0);
  const [redoutOpacity, setRedoutOpacity] = useState(0);
  const [tunnelVision, setTunnelVision] = useState(0);
  
  useEffect(() => {
    const gForce = aircraft.gForce || 1;
    
    // 正のG（ブラックアウト効果）
    if (gForce > 4) {
      const blackoutLevel = Math.min(1, (gForce - 4) / 5); // 4Gから始まり、9Gで完全にブラックアウト
      setBlackoutOpacity(blackoutLevel);
      
      // トンネルビジョン効果（視野狭窄）
      if (gForce > 3) {
        const tunnelLevel = Math.min(1, (gForce - 3) / 4); // 3Gから始まる
        setTunnelVision(tunnelLevel);
      } else {
        setTunnelVision(0);
      }
    } else {
      setBlackoutOpacity(0);
      setTunnelVision(0);
    }
    
    // 負のG（レッドアウト効果）
    if (gForce < -2) {
      const redoutLevel = Math.min(1, (-gForce - 2) / 3); // -2Gから始まり、-5Gで完全にレッドアウト
      setRedoutOpacity(redoutLevel);
    } else {
      setRedoutOpacity(0);
    }
  }, [aircraft.gForce]);
  
  // F-16以外では表示しない
  if (aircraft.type !== 'f16') {
    return null;
  }
  
  return (
    <>
      {/* ブラックアウト効果 */}
      {blackoutOpacity > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            backgroundColor: 'black',
            opacity: blackoutOpacity * 0.9,
          }}
        />
      )}
      
      {/* レッドアウト効果 */}
      {redoutOpacity > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            backgroundColor: 'red',
            opacity: redoutOpacity * 0.5,
          }}
        />
      )}
      
      {/* トンネルビジョン効果 */}
      {tunnelVision > 0 && (
        <div className="fixed inset-0 pointer-events-none z-49">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <radialGradient id="tunnelGradient">
                <stop offset={`${(1 - tunnelVision) * 100}%`} stopColor="black" stopOpacity="0" />
                <stop offset="100%" stopColor="black" stopOpacity={tunnelVision * 0.8} />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="url(#tunnelGradient)" />
          </svg>
        </div>
      )}
      
      {/* G力警告表示 */}
      {(aircraft.gForce > 7 || aircraft.gForce < -3) && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-51 pointer-events-none">
          <div className="text-4xl font-bold text-red-500 animate-pulse text-center">
            {aircraft.gForce > 7 ? 'HIGH G WARNING' : 'NEGATIVE G WARNING'}
            <div className="text-6xl mt-2">{aircraft.gForce.toFixed(1)}G</div>
          </div>
        </div>
      )}
    </>
  );
};