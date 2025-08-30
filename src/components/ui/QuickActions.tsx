import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { Vector3, Euler } from 'three';
import { INITIAL_POSITIONS } from '@/constants';

export const QuickActions: React.FC = () => {
  const { setAircraft, aircraft, setControls } = useSimulatorStore();
  
  const handleQuickTakeoff = () => {
    const aircraftType = aircraft.type;
    
    // 航空機タイプ別の離陸プロファイル
    if (aircraftType === 'f16') {
      // F-16: 超高速離陸
      setAircraft({
        throttle: 1.0,
        engineRPM: 100, // ジェットエンジン
        flaps: 0, // F-16は通常フラップなしで離陸
        brakes: false,
        landingGear: true,
      });
      
      setControls({
        throttle: 1.0, // 即座にアフターバーナー
        flaps: 0,
        brakes: false,
        pitch: 0,
        roll: 0,
        yaw: 0,
      });

      // 0.2秒後: 超高速機首上げ開始
      setTimeout(() => {
        setControls({ throttle: 1.0, pitch: 0.2 });
      }, 200);

      // 0.3秒後: 超高速強制離陸
      setTimeout(() => {
        setControls({ throttle: 1.0, pitch: 0.4 });
      }, 300);

      // 1秒後: 超高速ギア格納
      setTimeout(() => {
        setAircraft({ landingGear: false });
        setControls({ landingGear: false, pitch: 0.3 });
      }, 1000);

    } else if (aircraftType === 'boeing737') {
      // Boeing 737: 商用ジェット離陸
      setAircraft({
        throttle: 0.9, // N1 90%から開始
        engineRPM: 90,
        flaps: 15, // 離陸フラップ
        brakes: false,
        landingGear: true,
      });
      
      setControls({
        throttle: 0.9,
        flaps: 15,
        brakes: false,
        pitch: 0,
        roll: 0,
        yaw: 0,
      });

      // 0.2秒後: 高速フルパワー（0.8倍速）
      setTimeout(() => {
        setAircraft({ throttle: 1.0, engineRPM: 100 });
        setControls({ throttle: 1.0 });
      }, 200);

      // 0.45秒後: 高速機首上げ開始（0.8倍速、さらに強化）
      setTimeout(() => {
        setControls({ throttle: 1.0, pitch: 0.5, flaps: 15 });
      }, 450);

      // 0.6秒後: 高速強制離陸（0.8倍速、機首超極限上げ）
      setTimeout(() => {
        setControls({ throttle: 1.0, pitch: 0.8, flaps: 15 });
      }, 600);

      // 2秒後: 離陸後の機首上げ超大幅維持
      setTimeout(() => {
        setControls({ throttle: 1.0, pitch: 0.6, flaps: 15 });
      }, 2000);

      // 8秒後: ギア格納（機首上げ大幅維持）
      setTimeout(() => {
        setAircraft({ landingGear: false, flaps: 5 });
        setControls({ landingGear: false, flaps: 5, pitch: 0.25 });
      }, 8000);

      // 12秒後: クリーン構成（上昇姿勢大幅維持）
      setTimeout(() => {
        setAircraft({ flaps: 0 });
        setControls({ flaps: 0, pitch: 0.2 });
      }, 12000);

    } else {
      // Cessna 172: 既存の離陸プロファイル
      setAircraft({
        throttle: 1.0,
        engineRPM: 2700,
        flaps: 10,
        brakes: false,
        landingGear: true,
      });
      
      setControls({
        throttle: 1.0,
        flaps: 10,
        brakes: false,
        pitch: 0,
        roll: 0,
        yaw: 0,
      });

      setTimeout(() => {
        setControls({ throttle: 1.0, pitch: 0.3, flaps: 10 });
      }, 500);

      setTimeout(() => {
        setControls({ throttle: 1.0, pitch: 0.55, flaps: 10 });
      }, 750);

      // 1.5秒後: 離陸後の機首上げ大幅維持
      setTimeout(() => {
        setControls({ throttle: 1.0, pitch: 0.4, flaps: 10 });
      }, 1500);

      setTimeout(() => {
        setAircraft({ landingGear: false, flaps: 5 });
        setControls({ flaps: 5, landingGear: false, pitch: 0.35 });
      }, 8000);

      setTimeout(() => {
        setAircraft({ flaps: 0 });
        setControls({ flaps: 0, pitch: 0.3 });
      }, 12000);
    }
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
        <div className="font-semibold mb-2 text-yellow-400">操作ボタン:</div>
        <div className="space-y-1">
          <div>• 自動離陸: 正常な離陸プロセスの手本</div>
          <div>• 位置リセット: 滑走路上に機体を戻す</div>
        </div>
      </div>
      
      {/* ボタンをもう少し上に配置 */}
      <div className="fixed bottom-32 left-4 flex flex-col gap-2 z-40">
        <button
          onClick={handleQuickTakeoff}
          className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors min-h-[3rem] flex items-center justify-center"
        >
          自動離陸（手本）
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
