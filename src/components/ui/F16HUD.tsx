import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

export const F16HUD: React.FC = () => {
  const { aircraft, hudSettings } = useSimulatorStore();
  
  if (aircraft.type !== 'f16') {
    return null;
  }
  
  const machNumber = aircraft.airspeed / 1225;
  const isAfterburner = aircraft.throttle > 0.8;
  const gForce = aircraft.gForce || 1;
  const gLimitWarning = Math.abs(gForce) > 7;
  
  // レーダー高度（地表からの高度）
  const radarAltitude = Math.max(0, aircraft.altitude - 0.5);
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="hudGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g filter="url(#hudGlow)" fill="none" stroke="#00ff00" strokeWidth="2" opacity="0.9">
          {/* ピッチラダー */}
          <g transform={`translate(960, 540)`}>
            {[-60, -40, -20, -10, 10, 20, 40, 60].map(angle => {
              const y = -angle * 5 - aircraft.rotation.x * 180 / Math.PI * 5;
              const isPositive = angle > 0;
              return (
                <g key={angle} transform={`translate(0, ${y})`}>
                  <line x1={isPositive ? -100 : -150} y1="0" x2={isPositive ? -40 : -40} y2="0" />
                  <line x1={isPositive ? 40 : 40} y1="0" x2={isPositive ? 100 : 150} y2="0" />
                  <text x={isPositive ? -120 : -170} y="5" fill="#00ff00" stroke="none" fontSize="16" textAnchor="end">
                    {angle}
                  </text>
                  <text x={isPositive ? 120 : 170} y="5" fill="#00ff00" stroke="none" fontSize="16">
                    {angle}
                  </text>
                </g>
              );
            })}
            
            {/* 中央の航空機シンボル */}
            <g>
              <line x1="-60" y1="0" x2="-20" y2="0" strokeWidth="3" />
              <line x1="20" y1="0" x2="60" y2="0" strokeWidth="3" />
              <line x1="0" y1="-10" x2="0" y2="-5" strokeWidth="3" />
              <circle cx="0" cy="0" r="3" fill="#00ff00" stroke="none" />
            </g>
            
            {/* フライトパスマーカー */}
            <g transform={`translate(${aircraft.velocity.x * 0.5}, ${-aircraft.velocity.y * 0.5})`}>
              <circle cx="0" cy="0" r="20" strokeWidth="2" />
              <line x1="-20" y1="0" x2="-10" y2="0" />
              <line x1="10" y1="0" x2="20" y2="0" />
              <line x1="0" y1="-20" x2="0" y2="-10" />
            </g>
          </g>
          
          {/* 左側：速度とマッハ数 */}
          <g transform="translate(200, 540)">
            <rect x="-80" y="-150" width="160" height="300" fill="rgba(0,0,0,0.5)" stroke="#00ff00" />
            <text x="0" y="-120" fill="#00ff00" stroke="none" fontSize="20" textAnchor="middle">SPEED</text>
            <text x="0" y="-80" fill="#00ff00" stroke="none" fontSize="36" textAnchor="middle">
              {Math.round(aircraft.airspeed)}
            </text>
            <text x="0" y="-40" fill="#00ff00" stroke="none" fontSize="20" textAnchor="middle">KM/H</text>
            <text x="0" y="0" fill="#00ff00" stroke="none" fontSize="24" textAnchor="middle">
              M {machNumber.toFixed(2)}
            </text>
          </g>
          
          {/* 右側：高度 */}
          <g transform="translate(1720, 540)">
            <rect x="-80" y="-150" width="160" height="300" fill="rgba(0,0,0,0.5)" stroke="#00ff00" />
            <text x="0" y="-120" fill="#00ff00" stroke="none" fontSize="20" textAnchor="middle">ALT</text>
            <text x="0" y="-80" fill="#00ff00" stroke="none" fontSize="36" textAnchor="middle">
              {Math.round(aircraft.altitude)}
            </text>
            <text x="0" y="-40" fill="#00ff00" stroke="none" fontSize="20" textAnchor="middle">M</text>
            <text x="0" y="20" fill="#00ff00" stroke="none" fontSize="20" textAnchor="middle">RALT</text>
            <text x="0" y="50" fill="#00ff00" stroke="none" fontSize="28" textAnchor="middle">
              {Math.round(radarAltitude)}
            </text>
          </g>
          
          {/* 上部：方位 */}
          <g transform="translate(960, 100)">
            <rect x="-100" y="-30" width="200" height="60" fill="rgba(0,0,0,0.5)" stroke="#00ff00" />
            <text x="0" y="8" fill="#00ff00" stroke="none" fontSize="36" textAnchor="middle">
              {Math.round(aircraft.heading).toString().padStart(3, '0')}°
            </text>
          </g>
          
          {/* 左下：G力メーター */}
          <g transform="translate(200, 900)">
            <rect x="-80" y="-80" width="160" height="160" fill="rgba(0,0,0,0.5)" stroke="#00ff00" />
            <text x="0" y="-50" fill="#00ff00" stroke="none" fontSize="20" textAnchor="middle">G</text>
            <text 
              x="0" 
              y="0" 
              fill={gLimitWarning ? "#ff0000" : "#00ff00"} 
              stroke="none" 
              fontSize="48" 
              textAnchor="middle"
            >
              {gForce.toFixed(1)}
            </text>
            {gLimitWarning && (
              <text x="0" y="40" fill="#ff0000" stroke="none" fontSize="20" textAnchor="middle">LIMIT</text>
            )}
          </g>
          
          {/* 右下：エンジンと燃料 */}
          <g transform="translate(1720, 900)">
            <rect x="-80" y="-80" width="160" height="160" fill="rgba(0,0,0,0.5)" stroke="#00ff00" />
            <text x="0" y="-50" fill="#00ff00" stroke="none" fontSize="20" textAnchor="middle">FUEL</text>
            <text x="0" y="-20" fill="#00ff00" stroke="none" fontSize="28" textAnchor="middle">
              {Math.round(aircraft.fuel)} L
            </text>
            <text x="0" y="20" fill="#00ff00" stroke="none" fontSize="20" textAnchor="middle">
              {isAfterburner ? "AB ON" : "MIL PWR"}
            </text>
            <text 
              x="0" 
              y="50" 
              fill={isAfterburner ? "#ff6600" : "#00ff00"} 
              stroke="none" 
              fontSize="28" 
              textAnchor="middle"
            >
              {Math.round(aircraft.throttle * 100)}%
            </text>
          </g>
          
          {/* 垂直速度インジケーター */}
          <g transform="translate(1820, 540)">
            <rect x="0" y="-150" width="60" height="300" fill="rgba(0,0,0,0.5)" stroke="#00ff00" />
            <line x1="30" y1="-150" x2="30" y2="150" strokeWidth="1" />
            <line x1="20" y1="0" x2="40" y2="0" strokeWidth="2" />
            <rect 
              x="25" 
              y={Math.max(-145, Math.min(145, -aircraft.verticalSpeed * 2))} 
              width="10" 
              height="5" 
              fill="#00ff00"
            />
            <text x="30" y="-160" fill="#00ff00" stroke="none" fontSize="16" textAnchor="middle">V/S</text>
          </g>
          
          {/* ステータス情報 */}
          <g transform="translate(100, 200)">
            {aircraft.landingGear && (
              <text x="0" y="0" fill="#00ff00" stroke="none" fontSize="24">GEAR DOWN</text>
            )}
            {aircraft.brakes && (
              <text x="0" y="30" fill="#ff0000" stroke="none" fontSize="24">BRAKES</text>
            )}
            {aircraft.flaps > 0 && (
              <text x="0" y="60" fill="#00ff00" stroke="none" fontSize="24">FLAPS {Math.round(aircraft.flaps)}°</text>
            )}
          </g>
          
          {/* 警告メッセージ */}
          {aircraft.airspeed < 250 && aircraft.altitude > 100 && (
            <g transform="translate(960, 300)">
              <rect x="-150" y="-30" width="300" height="60" fill="rgba(255,0,0,0.8)" stroke="#ff0000" />
              <text x="0" y="8" fill="#ffffff" stroke="none" fontSize="32" textAnchor="middle">
                STALL WARNING
              </text>
            </g>
          )}
          
          {aircraft.altitude < 200 && aircraft.verticalSpeed < -10 && (
            <g transform="translate(960, 380)">
              <rect x="-150" y="-30" width="300" height="60" fill="rgba(255,0,0,0.8)" stroke="#ff0000" />
              <text x="0" y="8" fill="#ffffff" stroke="none" fontSize="32" textAnchor="middle">
                PULL UP
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};