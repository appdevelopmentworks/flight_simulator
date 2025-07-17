import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { Vector3, Euler } from 'three';
import { INITIAL_POSITIONS } from '@/constants';

export const QuickActions: React.FC = () => {
  const { setAircraft, aircraft, setControls } = useSimulatorStore();
  
  const handleQuickTakeoff = () => {
    // 強制的に離陸速度に設定
    const takeoffVelocity = new Vector3(0, 0, -30); // 約108km/h前進
    takeoffVelocity.applyEuler(aircraft.rotation);
    
    setAircraft({
      velocity: takeoffVelocity,
      airspeed: 108,
      engineRPM: 2700,
      throttle: 1,
      flaps: 10,
      brakes: false,
    });
    
    setControls({
      throttle: 1,
      brakes: false,
    });
  };
  
  const handleResetPosition = () => {
    // 羽田空港滑走路34Rの初期位置を取得
    const initialPos = INITIAL_POSITIONS.HANEDA_RUNWAY_34R;
    
    setAircraft({
      position: new Vector3(initialPos.position.x, initialPos.position.y, initialPos.position.z),
      rotation: new Euler(initialPos.rotation.x, initialPos.rotation.y, initialPos.rotation.z),
      velocity: new Vector3(0, 0, 0),
      airspeed: 0,
      altitude: initialPos.altitude,
      engineRPM: 0,
      throttle: 0,
      brakes: true,
      heading: 340, // 滑走路34Rの方向
      verticalSpeed: 0,
      flaps: 0,
      landingGear: true,
    });
    
    setControls({
      throttle: 0,
      brakes: true,
      pitch: 0,
      roll: 0,
      yaw: 0,
      flaps: 0,
      landingGear: true,
      autopilot: false,
    });
  };
  
  return (
    <>
      {/* 説明文を画面中央やや下に配置 */}
      <div className="fixed bottom-80 left-4 text-white text-xs bg-black/80 p-3 rounded border border-gray-600 max-w-xs z-50">
        <div className="font-semibold mb-2 text-yellow-400">テスト用ボタン:</div>
        <div className="space-y-1">
          <div>• クイック離陸: 即座に離陸速度に設定</div>
          <div>• 位置リセット: 滑走路上に機体を戻す</div>
        </div>
      </div>
      
      {/* ボタンをもう少し上に配置 */}
      <div className="fixed bottom-32 left-4 flex flex-col gap-2 z-40">
        <button
          onClick={handleQuickTakeoff}
          className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors min-h-[3rem] flex items-center justify-center"
        >
          クイック離陸（テスト用）
        </button>
        <button
          onClick={handleResetPosition}
          className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors min-h-[3rem] flex items-center justify-center"
        >
          位置リセット
        </button>
      </div>
    </>
  );
};
