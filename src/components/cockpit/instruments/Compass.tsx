import React from 'react';

interface CompassProps {
  heading: number; // 度
}

export const Compass: React.FC<CompassProps> = ({ heading }) => {
  // 安全チェック
  const safeHeading = heading || 0;
  
  return (
    <div className="relative w-32 h-32 bg-black rounded-full border-4 border-gray-700 shadow-inner overflow-hidden">
      {/* 回転するコンパスローズ */}
      <div
        className="absolute inset-0 transition-transform duration-200"
        style={{ transform: `rotate(${-safeHeading}deg)` }}
      >
        <svg className="w-full h-full">
          {/* 主要方位 */}
          {[
            { dir: 'N', angle: 0, color: '#ff0000' },
            { dir: 'E', angle: 90, color: '#ffffff' },
            { dir: 'S', angle: 180, color: '#ffffff' },
            { dir: 'W', angle: 270, color: '#ffffff' },
          ].map(({ dir, angle, color }) => {
            const radian = (angle - 90) * Math.PI / 180;
            const x = 64 + 45 * Math.cos(radian);
            const y = 64 + 45 * Math.sin(radian);
            return (
              <text
                key={dir}
                x={x}
                y={y}
                fill={color}
                fontSize="16"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ transform: `rotate(${safeHeading}deg)`, transformOrigin: `${x}px ${y}px` }}
              >
                {dir}
              </text>
            );
          })}
          
          {/* 30度ごとの数字 */}
          {[30, 60, 120, 150, 210, 240, 300, 330].map((deg) => {
            const radian = (deg - 90) * Math.PI / 180;
            const x = 64 + 45 * Math.cos(radian);
            const y = 64 + 45 * Math.sin(radian);
            return (
              <text
                key={deg}
                x={x}
                y={y}
                fill="white"
                fontSize="12"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ transform: `rotate(${safeHeading}deg)`, transformOrigin: `${x}px ${y}px` }}
              >
                {deg / 10}
              </text>
            );
          })}
          
          {/* 10度ごとの目盛り */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = i * 10;
            const radian = (angle - 90) * Math.PI / 180;
            const isMajor = angle % 30 === 0;
            const innerRadius = isMajor ? 52 : 55;
            const outerRadius = 60;
            const x1 = 64 + innerRadius * Math.cos(radian);
            const y1 = 64 + innerRadius * Math.sin(radian);
            const x2 = 64 + outerRadius * Math.cos(radian);
            const y2 = 64 + outerRadius * Math.sin(radian);
            
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
      </div>
      
      {/* 固定の機首マーク */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className="w-0 h-0 border-l-8 border-r-8 border-b-12 border-transparent border-b-orange-500"></div>
      </div>
      
      {/* 中心点 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
      
      {/* デジタル表示 */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-0.5 rounded">
        <span className="text-green-400 font-mono text-xs font-bold">
          {Math.round(safeHeading).toString().padStart(3, '0')}°
        </span>
      </div>
    </div>
  );
};
