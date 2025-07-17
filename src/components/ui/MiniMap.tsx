import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

export const MiniMap: React.FC = () => {
  const { aircraft } = useSimulatorStore();
  
  // マップのスケール（1px = 50m）
  const scale = 0.02;
  const mapSize = 200;
  const centerX = mapSize / 2;
  const centerY = mapSize / 2;
  
  // 航空機の位置をマップ座標に変換
  const aircraftMapX = centerX + aircraft.position.x * scale;
  const aircraftMapY = centerY - aircraft.position.z * scale;
  
  return (
    <div className="fixed top-4 right-4 w-52 h-52 bg-black/80 rounded-lg border border-gray-700 overflow-hidden">
      <div className="relative w-full h-full">
        {/* マップ背景 */}
        <svg className="absolute inset-0 w-full h-full">
          {/* グリッド */}
          {Array.from({ length: 11 }).map((_, i) => (
            <React.Fragment key={`grid-${i}`}>
              <line
                x1={i * 20}
                y1={0}
                x2={i * 20}
                y2={200}
                stroke="#333"
                strokeWidth="1"
                opacity="0.5"
              />
              <line
                x1={0}
                y1={i * 20}
                x2={200}
                y2={i * 20}
                stroke="#333"
                strokeWidth="1"
                opacity="0.5"
              />
            </React.Fragment>
          ))}
          
          {/* 滑走路 */}
          <rect
            x={centerX - 1.5}
            y={centerY - 30}
            width={3}
            height={60}
            fill="#666"
            transform={`rotate(${-20} ${centerX} ${centerY})`}
          />
          
          {/* 空港施設 */}
          <rect
            x={centerX + 20}
            y={centerY - 10}
            width={30}
            height={20}
            fill="#444"
          />
          <text
            x={centerX + 35}
            y={centerY}
            fill="#888"
            fontSize="8"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            RJTT
          </text>
          
          {/* 航空機の位置 */}
          <g transform={`translate(${aircraftMapX}, ${aircraftMapY})`}>
            {/* 航空機シンボル */}
            <g transform={`rotate(${aircraft.heading} 0 0)`}>
              <path
                d="M 0 -8 L -3 3 L 0 1 L 3 3 Z"
                fill="#00ff00"
                stroke="#00ff00"
                strokeWidth="1"
              />
              <line
                x1={-6}
                y1={0}
                x2={6}
                y2={0}
                stroke="#00ff00"
                strokeWidth="1"
              />
            </g>
          </g>
          
          {/* 航跡 */}
          <circle
            cx={aircraftMapX}
            cy={aircraftMapY}
            r="2"
            fill="none"
            stroke="#00ff00"
            strokeWidth="1"
            opacity="0.5"
          >
            <animate
              attributeName="r"
              from="2"
              to="20"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.5"
              to="0"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
        
        {/* 情報表示 */}
        <div className="absolute top-1 left-1 text-xs space-y-0.5">
          <div className="text-green-400 font-mono">
            HDG {Math.round(aircraft.heading).toString().padStart(3, '0')}°
          </div>
          <div className="text-green-400 font-mono">
            ALT {Math.round(aircraft.altitude)}m
          </div>
          <div className="text-green-400 font-mono">
            SPD {Math.round(aircraft.airspeed)}km/h
          </div>
        </div>
        
        {/* スケール表示 */}
        <div className="absolute bottom-1 right-1 flex items-center">
          <div className="w-10 h-0.5 bg-white/50 mr-1"></div>
          <span className="text-white/50 text-xs">2km</span>
        </div>
        
        {/* 方位表示 */}
        <div className="absolute top-1 right-1">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border border-white/30 rounded-full"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-white/50 text-xs">N</div>
            <div
              className="absolute top-1/2 left-1/2 w-0.5 h-3 bg-red-500 origin-bottom"
              style={{ transform: `translate(-50%, -100%) rotate(${aircraft.heading}deg)` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
