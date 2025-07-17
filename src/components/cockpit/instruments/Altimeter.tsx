import React from 'react';

interface AltimeterProps {
  altitude: number; // メートル
}

export const Altimeter: React.FC<AltimeterProps> = ({ altitude }) => {
  // 安全チェック
  const safeAltitude = altitude || 0;
  
  // 高度を角度に変換（1000mで360度）
  const needleAngle = (safeAltitude % 1000) * 0.36;
  const smallNeedleAngle = (safeAltitude / 10000) * 360;
  
  return (
    <div className="relative w-32 h-32 bg-black rounded-full border-4 border-gray-700 shadow-inner">
      {/* 背景の目盛り */}
      <svg className="absolute inset-0 w-full h-full">
        {/* 外周の数字 */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const angle = num * 36 - 90;
          const x = 64 + 45 * Math.cos(angle * Math.PI / 180);
          const y = 64 + 45 * Math.sin(angle * Math.PI / 180);
          return (
            <text
              key={num}
              x={x}
              y={y}
              fill="white"
              fontSize="12"
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-mono"
            >
              {num}
            </text>
          );
        })}
        
        {/* 目盛り線 */}
        {Array.from({ length: 50 }).map((_, i) => {
          const angle = i * 7.2 - 90;
          const isMajor = i % 5 === 0;
          const innerRadius = isMajor ? 50 : 55;
          const outerRadius = 60;
          const x1 = 64 + innerRadius * Math.cos(angle * Math.PI / 180);
          const y1 = 64 + innerRadius * Math.sin(angle * Math.PI / 180);
          const x2 = 64 + outerRadius * Math.cos(angle * Math.PI / 180);
          const y2 = 64 + outerRadius * Math.sin(angle * Math.PI / 180);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="white"
              strokeWidth={isMajor ? 2 : 1}
              opacity={isMajor ? 1 : 0.5}
            />
          );
        })}
      </svg>
      
      {/* 100m単位の針（太い針） */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${needleAngle}deg)` }}
      >
        <div className="relative w-full h-1">
          <div className="absolute left-1/2 top-0 w-12 h-1 bg-white origin-left"></div>
        </div>
      </div>
      
      {/* 1000m単位の針（細い針） */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${smallNeedleAngle}deg)` }}
      >
        <div className="relative w-full h-0.5">
          <div className="absolute left-1/2 top-0 w-8 h-0.5 bg-white origin-left"></div>
        </div>
      </div>
      
      {/* 中心点 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
      
      {/* デジタル表示 */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-0.5 rounded">
        <span className="text-green-400 font-mono text-xs">
          {Math.round(safeAltitude).toString().padStart(5, '0')}m
        </span>
      </div>
    </div>
  );
};
