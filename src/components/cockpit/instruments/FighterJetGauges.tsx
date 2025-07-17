import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

interface FighterJetGaugesProps {
  rpm: number;
  fuel: number;
  throttle: number;
}

export const FighterJetGauges: React.FC<FighterJetGaugesProps> = ({ rpm, fuel, throttle }) => {
  const { aircraft } = useSimulatorStore();
  
  // F-16のエンジンパラメータ
  const n1Percent = rpm / 100; // N1は0-100%で表示
  const n2Percent = n1Percent * 0.98; // N2はN1に近い
  const egt = 500 + throttle * 700; // 排気温度 (°C) - 戦闘機はより高温
  const fuelFlow = throttle * 1500; // kg/h
  const nozzlePosition = throttle > 0.8 ? 100 : throttle * 100; // ノズル開度
  const oilPressure = 50 + throttle * 30; // PSI
  
  // G力計算（簡略化）
  const gForce = 1 + Math.abs(aircraft.rotation.x) * 5 + Math.abs(aircraft.rotation.z) * 3;
  
  return (
    <div className="bg-gray-900 rounded-lg p-3 space-y-2 border border-gray-700">
      {/* エンジンコア速度 N1 */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">N1 CORE</span>
          <span className={`text-xs font-mono ${n1Percent > 95 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
            {n1Percent.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-200 ${
              n1Percent > 95 ? 'bg-gradient-to-r from-red-600 to-red-400' : 
              n1Percent > 80 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
              'bg-gradient-to-r from-green-600 to-green-400'
            }`}
            style={{ width: `${Math.min(100, n1Percent)}%` }}
          />
          {/* MIL/AB境界線 */}
          <div className="absolute w-0.5 h-full bg-yellow-500" style={{ left: '80%' }}></div>
        </div>
      </div>
      
      {/* アフターバーナー状態 */}
      {throttle > 0.8 && (
        <div className="p-1.5 bg-orange-900/50 rounded border border-orange-600 animate-pulse">
          <div className="text-orange-400 text-xs font-bold text-center">
            AFTERBURNER {((throttle - 0.8) * 500).toFixed(0)}%
          </div>
        </div>
      )}
      
      {/* EGT (排気温度) */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">EGT</span>
          <span className={`text-xs font-mono ${egt > 950 ? 'text-red-400' : 'text-green-400'}`}>
            {egt.toFixed(0)}°C
          </span>
        </div>
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-200 ${
              egt > 950 ? 'bg-gradient-to-r from-red-600 to-red-400' : 
              'bg-gradient-to-r from-yellow-600 to-orange-500'
            }`}
            style={{ width: `${Math.min(100, (egt / 1200) * 100)}%` }}
          />
        </div>
      </div>
      
      {/* ノズル位置 */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">NOZZLE</span>
          <span className="text-xs text-green-400 font-mono">{nozzlePosition.toFixed(0)}%</span>
        </div>
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-100"
            style={{ width: `${nozzlePosition}%` }}
          />
        </div>
      </div>
      
      {/* 燃料流量 */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">FF</span>
          <span className="text-xs text-green-400 font-mono">
            {(fuelFlow / 1000).toFixed(1)} T/h
          </span>
        </div>
      </div>
      
      {/* システムステータス */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-700">
        <div>
          <span className="text-gray-500">HYD:</span>
          <span className="text-green-400 ml-1">3000 PSI</span>
        </div>
        <div>
          <span className="text-gray-500">OIL:</span>
          <span className="text-green-400 ml-1">{oilPressure.toFixed(0)} PSI</span>
        </div>
        <div>
          <span className="text-gray-500">G:</span>
          <span className={`ml-1 ${gForce > 7 ? 'text-red-400' : 'text-green-400'}`}>
            {gForce.toFixed(1)}G
          </span>
        </div>
        <div>
          <span className="text-gray-500">AOA:</span>
          <span className="text-green-400 ml-1">
            {(Math.abs(aircraft.rotation.x) * 57.3).toFixed(0)}°
          </span>
        </div>
      </div>
      
      {/* 警告システム */}
      {gForce > 7 && (
        <div className="mt-2 p-1 bg-red-900/50 rounded border border-red-600">
          <div className="text-red-400 text-xs font-bold text-center animate-pulse">
            G-LIMIT WARNING
          </div>
        </div>
      )}
      
      {n1Percent < 20 && aircraft.altitude > 100 && (
        <div className="mt-2 p-1 bg-red-900/50 rounded border border-red-600">
          <div className="text-red-400 text-xs font-bold text-center animate-pulse">
            ENGINE FLAME OUT
          </div>
        </div>
      )}
    </div>
  );
};
