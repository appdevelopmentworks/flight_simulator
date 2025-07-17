import React from 'react';

interface ArtificialHorizonProps {
  pitch: number; // 度
  roll: number; // 度
}

export const ArtificialHorizon: React.FC<ArtificialHorizonProps> = ({ pitch, roll }) => {
  // 安全チェック
  const safePitch = pitch || 0;
  const safeRoll = roll || 0;
  
  return (
    <div className="relative w-32 h-32 bg-black rounded-full overflow-hidden border-4 border-gray-700 shadow-inner">
      {/* 背景（空と地面） */}
      <div
        className="absolute inset-0 transition-transform duration-100"
        style={{ transform: `rotate(${safeRoll}deg)` }}
      >
        <div
          className="absolute w-full h-64 -top-16 transition-transform duration-100"
          style={{ transform: `translateY(${safePitch}px)` }}
        >
          {/* 空 */}
          <div className="h-32 bg-gradient-to-b from-blue-600 to-blue-400"></div>
          {/* 地平線 */}
          <div className="h-1 bg-white"></div>
          {/* 地面 */}
          <div className="h-32 bg-gradient-to-b from-amber-700 to-amber-900"></div>
        </div>
      </div>
      
      {/* ピッチマーカー */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="space-y-4">
          {[-20, -10, 0, 10, 20].map((angle) => (
            <div key={angle} className="flex items-center justify-center">
              <div className="w-8 h-0.5 bg-white/60"></div>
              <span className="text-white/60 text-xs mx-2">{angle}</span>
              <div className="w-8 h-0.5 bg-white/60"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 中央の航空機シンボル */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div className="absolute w-12 h-1 bg-yellow-400 -left-6 top-0"></div>
          <div className="absolute w-1 h-4 bg-yellow-400 left-0 -top-2"></div>
        </div>
      </div>
      
      {/* ロール指示器 */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
        <div className="relative">
          <div className="flex space-x-1">
            {[-60, -30, 0, 30, 60].map((angle) => (
              <div
                key={angle}
                className={`w-0.5 h-2 ${angle === 0 ? 'bg-yellow-400' : 'bg-white/60'}`}
              />
            ))}
          </div>
          <div
            className="absolute top-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-400"
            style={{ left: `${50 + (safeRoll / 60) * 50}%`, transform: 'translateX(-50%)' }}
          />
        </div>
      </div>
    </div>
  );
};
