import React from 'react';

interface VerticalSpeedProps {
  speed: number; // m/s
}

export const VerticalSpeed: React.FC<VerticalSpeedProps> = ({ speed }) => {
  // 安全チェック
  const safeSpeed = speed || 0;
  
  // 昇降率を角度に変換（-20～+20 m/sを-120～+120度にマッピング）
  const needleAngle = Math.max(-120, Math.min(120, (safeSpeed / 20) * 120));
  
  return (
    <div className="relative w-32 h-32 bg-black rounded-full border-4 border-gray-700 shadow-inner">
      {/* 背景の目盛り */}
      <svg className="absolute inset-0 w-full h-full">
        {/* 上昇・下降領域の背景 */}
        <path
          d="M 64 64 L 64 10 A 54 54 0 0 1 118 64 Z"
          fill="#00ff00"
          opacity="0.1"
        />
        <path
          d="M 64 64 L 10 64 A 54 54 0 0 1 64 10 Z"
          fill="#ff0000"
          opacity="0.1"
        />
        
        {/* 目盛り線と数字 */}
        {[-20, -15, -10, -5, 0, 5, 10, 15, 20].map((vSpeed) => {
          const angle = (vSpeed / 20) * 120;
          const radian = (angle - 90) * Math.PI / 180;
          const innerRadius = 45;
          const outerRadius = 55;
          const textRadius = 35;
          const x1 = 64 + innerRadius * Math.cos(radian);
          const y1 = 64 + innerRadius * Math.sin(radian);
          const x2 = 64 + outerRadius * Math.cos(radian);
          const y2 = 64 + outerRadius * Math.sin(radian);
          const textX = 64 + textRadius * Math.cos(radian);
          const textY = 64 + textRadius * Math.sin(radian);
          
          return (
            <g key={vSpeed}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="white"
                strokeWidth={vSpeed === 0 ? 3 : 2}
              />
              <text
                x={textX}
                y={textY}
                fill="white"
                fontSize="10"
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-mono"
              >
                {Math.abs(vSpeed)}
              </text>
            </g>
          );
        })}
        
        {/* UP/DN表示 */}
        <text
          x="64"
          y="25"
          fill="#00ff00"
          fontSize="12"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-bold"
        >
          UP
        </text>
        <text
          x="64"
          y="103"
          fill="#ff0000"
          fontSize="12"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-bold"
        >
          DN
        </text>
      </svg>
      
      {/* 昇降率針 */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
        style={{ transform: `rotate(${needleAngle}deg)` }}
      >
        <div className="relative w-full h-1">
          <div 
            className="absolute left-1/2 top-0 w-14 h-1 bg-white origin-left"
          ></div>
          <div 
            className="absolute left-1/2 top-0 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-white origin-left"
            style={{ transform: 'translateX(56px) translateY(-4px)' }}
          ></div>
        </div>
      </div>
      
      {/* 中心点 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
      </div>
      
      {/* デジタル表示 */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-0.5 rounded">
        <span 
          className={`font-mono text-xs font-bold ${safeSpeed > 0 ? 'text-green-400' : safeSpeed < 0 ? 'text-red-400' : 'text-white'}`}
        >
          {safeSpeed > 0 ? '+' : ''}{safeSpeed.toFixed(1)} m/s
        </span>
      </div>
      
      {/* 単位表示 */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
        <span className="text-white text-xs opacity-70">VERT SPEED</span>
      </div>
    </div>
  );
};
