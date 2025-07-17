import React from 'react';

interface AirspeedProps {
  speed: number; // km/h
}

export const Airspeed: React.FC<AirspeedProps> = ({ speed }) => {
  // 安全チェック
  const safeSpeed = speed || 0;
  
  // 速度を角度に変換（0-400 km/hを0-270度にマッピング）
  const needleAngle = Math.min(270, (safeSpeed / 400) * 270) - 135;
  
  // 速度範囲による色分け
  const getSpeedColor = (speed: number) => {
    if (speed < 90) return '#ff0000'; // 失速速度以下
    if (speed < 110) return '#ffa500'; // 警告域
    if (speed < 300) return '#00ff00'; // 正常域
    return '#ff0000'; // 超過速度
  };
  
  return (
    <div className="relative w-32 h-32 bg-black rounded-full border-4 border-gray-700 shadow-inner">
      {/* 背景の目盛り */}
      <svg className="absolute inset-0 w-full h-full">
        {/* 速度帯の色分け */}
        <path
          d="M 64 64 L 64 10 A 54 54 0 0 1 90 20 Z"
          fill="#ff0000"
          opacity="0.3"
        />
        <path
          d="M 64 64 L 90 20 A 54 54 0 0 1 100 35 Z"
          fill="#ffa500"
          opacity="0.3"
        />
        <path
          d="M 64 64 L 100 35 A 54 54 0 0 1 118 100 Z"
          fill="#00ff00"
          opacity="0.3"
        />
        
        {/* 目盛り線と数字 */}
        {[0, 50, 100, 150, 200, 250, 300, 350, 400].map((speedMark) => {
          const angle = (speedMark / 400) * 270 - 135;
          const radian = angle * Math.PI / 180;
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
            <g key={speedMark}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="white"
                strokeWidth="2"
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
                {speedMark === 0 ? '0' : speedMark / 100}
              </text>
            </g>
          );
        })}
        
        {/* 細かい目盛り */}
        {Array.from({ length: 40 }).map((_, i) => {
          const speedValue = i * 10;
          if (speedValue % 50 === 0) return null;
          const angle = (speedValue / 400) * 270 - 135;
          const radian = angle * Math.PI / 180;
          const innerRadius = 50;
          const outerRadius = 55;
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
              strokeWidth="1"
              opacity="0.5"
            />
          );
        })}
      </svg>
      
      {/* 速度針 */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
        style={{ transform: `rotate(${needleAngle}deg)` }}
      >
        <div className="relative w-full h-1">
          <div 
            className="absolute left-1/2 top-0 w-14 h-1 origin-left"
            style={{ backgroundColor: getSpeedColor(safeSpeed) }}
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
          className="font-mono text-xs font-bold"
          style={{ color: getSpeedColor(safeSpeed) }}
        >
          {Math.round(safeSpeed)} km/h
        </span>
      </div>
      
      {/* 単位表示 */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
        <span className="text-white text-xs opacity-70">AIRSPEED</span>
      </div>
    </div>
  );
};
