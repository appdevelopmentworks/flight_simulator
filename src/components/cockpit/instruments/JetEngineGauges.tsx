import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

interface JetEngineGaugesProps {
  engineNumber: number;
}

export const JetEngineGauges: React.FC<JetEngineGaugesProps> = ({ engineNumber }) => {
  const { aircraft } = useSimulatorStore();
  
  // 安全チェック
  if (!aircraft) {
    return <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-white text-center">Loading...</div>;
  }
  
  // Boeing 737のエンジンパラメータ
  const n1Percent = aircraft.engineRPM || 0; // N1は0-100%で表示
  const n2Percent = n1Percent * 0.95; // N2はN1より少し低い
  const egt = 400 + (aircraft.throttle || 0) * 500; // 排気温度 (°C)
  const fuelFlow = (aircraft.throttle || 0) * 2600; // kg/h
  const epr = 1.0 + (aircraft.throttle || 0) * 0.6; // エンジン圧力比
  
  return (
    <div className="bg-gray-900 rounded-lg p-3 space-y-3 border border-gray-700">
      {/* エンジン番号 */}
      <div className="text-center text-white text-sm font-bold border-b border-gray-700 pb-2">
        ENGINE {engineNumber}
      </div>
      {/* N1ゲージ */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">N1</span>
          <span className={`text-xs font-mono ${n1Percent > 95 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
            {n1Percent.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-200 ${
              n1Percent > 95 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-green-600 to-green-400'
            }`}
            style={{ width: `${Math.min(100, n1Percent)}%` }}
          />
          {/* 危険域マーカー */}
          <div className="absolute right-0 top-0 w-[5%] h-full bg-red-900/50"></div>
        </div>
      </div>
      
      {/* N2ゲージ */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">N2</span>
          <span className="text-xs text-green-400 font-mono">{n2Percent.toFixed(1)}%</span>
        </div>
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-200"
            style={{ width: `${Math.min(100, n2Percent)}%` }}
          />
        </div>
      </div>
      
      {/* EGT (排気温度) */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">EGT</span>
          <span className={`text-xs font-mono ${egt > 850 ? 'text-red-400' : 'text-green-400'}`}>
            {egt.toFixed(0)}°C
          </span>
        </div>
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-200 ${
              egt > 850 ? 'bg-gradient-to-r from-orange-600 to-red-600' : 'bg-gradient-to-r from-yellow-600 to-orange-500'
            }`}
            style={{ width: `${Math.min(100, (egt / 1000) * 100)}%` }}
          />
          {/* 警告域マーカー */}
          <div className="absolute w-[15%] h-full bg-red-900/30" style={{ left: '85%' }}></div>
        </div>
      </div>
      
      {/* EPR (エンジン圧力比) */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">EPR</span>
          <span className="text-xs text-green-400 font-mono">{epr.toFixed(2)}</span>
        </div>
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-100"
            style={{ width: `${Math.min(100, ((epr - 1.0) / 0.8) * 100)}%` }}
          />
        </div>
      </div>
      
      {/* 燃料流量 */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">FUEL FLOW</span>
          <span className="text-xs text-green-400 font-mono">
            {(fuelFlow / 1000).toFixed(1)} T/h
          </span>
        </div>
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-100"
            style={{ width: `${Math.min(100, (fuelFlow / 3000) * 100)}%` }}
          />
        </div>
      </div>
      
      {/* リバーススラスト表示 */}
      {(aircraft.altitude || 0) < 10 && (aircraft.throttle || 0) < -0.1 && (
        <div className="mt-2 p-2 bg-yellow-900/50 rounded border border-yellow-600">
          <div className="text-yellow-400 text-xs font-bold text-center animate-pulse">
            REVERSE THRUST
          </div>
        </div>
      )}
      
      {/* エンジンステータス */}
      <div className="mt-2 pt-2 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">OIL PRESS:</span>
            <span className="text-green-400 ml-1">45 PSI</span>
          </div>
          <div>
            <span className="text-gray-500">OIL TEMP:</span>
            <span className="text-green-400 ml-1">82°C</span>
          </div>
          <div>
            <span className="text-gray-500">VIB:</span>
            <span className="text-green-400 ml-1">0.3</span>
          </div>
          <div>
            <span className="text-gray-500">HYD:</span>
            <span className="text-green-400 ml-1">3000 PSI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
