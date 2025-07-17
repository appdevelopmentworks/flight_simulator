import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { JetEngineGauges } from './JetEngineGauges';
import { Altimeter } from './Altimeter';
import { Airspeed } from './Airspeed';
import { ArtificialHorizon } from './ArtificialHorizon';
import { Compass } from './Compass';
import { VerticalSpeed } from './VerticalSpeed';

export const Boeing737Panel: React.FC = () => {
  const { aircraft, controls, gameSettings } = useSimulatorStore();

  // 安全チェック
  if (!aircraft) {
    return <div className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center pointer-events-none">
      {/* 主要計器パネル */}
      <div className="grid grid-cols-6 gap-4 p-8 max-w-7xl">
        {/* 第1行: 主要飛行計器 */}
        <div className="col-span-6 grid grid-cols-6 gap-4">
          {/* 対気速度計 */}
          <div className="col-span-1">
            <Airspeed speed={aircraft.airspeed || 0} />
          </div>
          
          {/* 姿勢指示器 */}
          <div className="col-span-1">
            <ArtificialHorizon 
              pitch={(aircraft.rotation?.x || 0) * 180 / Math.PI} 
              roll={(aircraft.rotation?.z || 0) * 180 / Math.PI} 
            />
          </div>
          
          {/* 高度計 */}
          <div className="col-span-1">
            <Altimeter altitude={aircraft.altitude || 0} />
          </div>
          
          {/* 昇降計 */}
          <div className="col-span-1">
            <VerticalSpeed speed={aircraft.verticalSpeed || 0} />
          </div>
          
          {/* 方位計 */}
          <div className="col-span-1">
            <Compass heading={aircraft.heading || 0} />
          </div>
          
          {/* 推力設定 */}
          <div className="col-span-1">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 w-32 h-32">
              <div className="text-white text-xs font-bold text-center mb-2">N1</div>
              <div className="relative w-20 h-20 mx-auto">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* 背景円 */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#333" strokeWidth="2"/>
                  {/* 目盛り */}
                  {Array.from({ length: 11 }, (_, i) => {
                    const angle = (i * 18) - 90;
                    const x1 = 50 + 35 * Math.cos(angle * Math.PI / 180);
                    const y1 = 50 + 35 * Math.sin(angle * Math.PI / 180);
                    const x2 = 50 + 40 * Math.cos(angle * Math.PI / 180);
                    const y2 = 50 + 40 * Math.sin(angle * Math.PI / 180);
                    return (
                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ccc" strokeWidth="1"/>
                    );
                  })}
                  {/* 針 */}
                  <line
                    x1="50"
                    y1="50"
                    x2={50 + 30 * Math.cos((aircraft.engineRPM * 1.8 - 90) * Math.PI / 180)}
                    y2={50 + 30 * Math.sin((aircraft.engineRPM * 1.8 - 90) * Math.PI / 180)}
                    stroke="#00ff00"
                    strokeWidth="2"
                  />
                  <circle cx="50" cy="50" r="2" fill="#00ff00"/>
                </svg>
              </div>
              <div className="text-green-400 text-xs font-bold text-center mt-1">
                {(aircraft.engineRPM || 0).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* 第2行: エンジン計器 */}
        <div className="col-span-6 grid grid-cols-2 gap-4">
          <JetEngineGauges engineNumber={1} />
          <JetEngineGauges engineNumber={2} />
        </div>

        {/* 第3行: システム表示 */}
        <div className="col-span-6 grid grid-cols-3 gap-4">
          {/* 燃料計 */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <div className="text-white text-xs font-bold text-center mb-2">FUEL</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300 text-xs">LEFT</span>
                <span className="text-green-400 text-xs">{((aircraft.fuel || 0) / 2).toFixed(0)}L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-xs">RIGHT</span>
                <span className="text-green-400 text-xs">{((aircraft.fuel || 0) / 2).toFixed(0)}L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-xs">TOTAL</span>
                <span className="text-green-400 text-xs font-bold">{(aircraft.fuel || 0).toFixed(0)}L</span>
              </div>
            </div>
          </div>

          {/* フラップ/ギア表示 */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <div className="text-white text-xs font-bold text-center mb-2">CONFIG</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300 text-xs">FLAPS</span>
                <span className="text-green-400 text-xs">{aircraft.flaps || 0}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-xs">GEAR</span>
                <span className={`text-xs font-bold ${aircraft.landingGear ? 'text-green-400' : 'text-red-400'}`}>
                  {aircraft.landingGear ? 'DOWN' : 'UP'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-xs">BRAKE</span>
                <span className={`text-xs font-bold ${aircraft.brakes ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {aircraft.brakes ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>

          {/* 警告灯 */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <div className="text-white text-xs font-bold text-center mb-2">WARNINGS</div>
            <div className="space-y-1">
              {(aircraft.fuel || 0) < 5000 && (
                <div className="bg-red-600 text-white text-xs px-2 py-1 rounded text-center">
                  LOW FUEL
                </div>
              )}
              {(aircraft.airspeed || 0) < 300 && (aircraft.altitude || 0) > 1000 && (
                <div className="bg-yellow-600 text-white text-xs px-2 py-1 rounded text-center">
                  LOW SPEED
                </div>
              )}
              {(aircraft.altitude || 0) < 500 && !aircraft.landingGear && (
                <div className="bg-red-600 text-white text-xs px-2 py-1 rounded text-center">
                  GEAR UP
                </div>
              )}
              {!(aircraft.fuel || 0) && (
                <div className="bg-red-600 text-white text-xs px-2 py-1 rounded text-center">
                  FUEL EMPTY
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 操作説明 */}
      <div className="fixed bottom-4 right-4 bg-gray-800/80 border border-gray-600 rounded-lg p-3 text-xs text-white">
        <div className="font-bold mb-2">Boeing 737 Controls:</div>
        <div>W/S: Throttle | ↑/↓: Pitch | ←/→: Roll | A/D: Yaw</div>
        <div>F/G: Flaps | L: Landing Gear | B: Brakes</div>
        <div>1-4: Camera Views | H: Help | ESC: Pause</div>
      </div>
    </div>
  );
};