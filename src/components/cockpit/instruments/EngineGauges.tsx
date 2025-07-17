import React from 'react';
import { AIRCRAFT_SPECS } from '@/constants';
import { useSimulatorStore } from '@/store/simulatorStore';

interface EngineGaugesProps {
  rpm: number;
  fuel: number;
  throttle: number;
}

export const EngineGauges: React.FC<EngineGaugesProps> = ({ rpm, fuel, throttle }) => {
  const { aircraft } = useSimulatorStore();
  
  // デフォルト値を設定
  if (!aircraft || !aircraft.type) {
    return null;
  }
  
  const specs = AIRCRAFT_SPECS[aircraft.type];
  if (!specs) {
    return null;
  }
  
  const fuelPercentage = (fuel / specs.fuelCapacity) * 100;
  
  return (
    <div className="bg-gray-900 rounded-lg p-3 space-y-2 border border-gray-700">
      {/* RPMゲージ */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">RPM</span>
          <span className="text-xs text-green-400 font-mono">{Math.round(rpm)}</span>
        </div>
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-200"
            style={{ width: `${(rpm / 2700) * 100}%` }}
          />
          {/* 危険域マーカー */}
          <div className="absolute right-0 top-0 w-[15%] h-full bg-red-900/50"></div>
        </div>
      </div>
      
      {/* 燃料ゲージ */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">FUEL</span>
          <span className={`text-xs font-mono ${fuelPercentage < 20 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
            {fuelPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-500 ${
              fuelPercentage < 20 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'
            }`}
            style={{ width: `${fuelPercentage}%` }}
          />
          {/* 警告域マーカー */}
          <div className="absolute left-0 top-0 w-[20%] h-full bg-red-900/30"></div>
        </div>
        <div className="text-xs text-gray-500 text-right">
          {fuel.toFixed(1)} / {specs.fuelCapacity} L
        </div>
      </div>
      
      {/* スロットルインジケーター */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">THROTTLE</span>
          <span className="text-xs text-green-400 font-mono">{Math.round(throttle * 100)}%</span>
        </div>
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-100"
            style={{ width: `${throttle * 100}%` }}
          />
        </div>
      </div>
      
      {/* エンジン温度（仮） */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">ENG TEMP</span>
          <span className="text-xs text-green-400 font-mono">
            {Math.round(75 + throttle * 25)}°C
          </span>
        </div>
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
            style={{ width: `${75 + throttle * 25}%` }}
          />
        </div>
      </div>
    </div>
  );
};
