import React from 'react';
import { KEYBOARD_CONTROLS } from '@/constants';
import { useSimulatorStore } from '@/store/simulatorStore';

interface ControlsHelpProps {
  onClose: () => void;
}

export const ControlsHelp: React.FC<ControlsHelpProps> = ({ onClose }) => {
  const { aircraft } = useSimulatorStore();
  
  const controlCategories = [
    {
      title: '基本操作',
      controls: [
        { key: '↑/↓', action: 'ピッチ（機首上げ下げ）' },
        { key: '←/→', action: 'ロール（左右傾き）' },
        { key: 'A/D', action: 'ヨー（機首左右）' },
        { key: 'W/S', action: 'スロットル増減' },
        { key: 'X', action: 'スロットルアイドル' },
        { key: 'Z', action: 'スロットル全開' },
      ],
    },
    {
      title: 'システム',
      controls: [
        { key: 'F/G', action: 'フラップ上げ/下げ' },
        { key: 'L', action: 'ランディングギア' },
        { key: 'B', action: 'ブレーキ' },
        { key: 'P', action: 'オートパイロット' },
      ],
    },
    {
      title: 'カメラ',
      controls: [
        { key: '1', action: 'コックピット視点' },
        { key: '2', action: '外部視点' },
        { key: '3', action: 'タワー視点' },
        { key: '4', action: 'フリーカメラ' },
      ],
    },
    {
      title: 'その他',
      controls: [
        { key: 'ESC', action: 'ポーズ' },
        { key: 'M', action: 'マップ表示切替' },
        { key: 'H', action: 'ヘルプ表示' },
      ],
    },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">操作方法</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>
        
        {/* 操作説明 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {controlCategories.map((category) => (
            <div key={category.title} className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-white mb-3">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.controls.map((control) => (
                  <div
                    key={control.key}
                    className="flex justify-between items-center text-gray-300"
                  >
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-sm font-mono">
                      {control.key}
                    </kbd>
                    <span className="text-sm ml-4">{control.action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* フライトのヒント */}
        <div className="mt-6 bg-blue-900/30 rounded-lg p-4">
          <h3 className="text-xl font-semibold text-white mb-3">
            {aircraft.type === 'boeing737' ? 'Boeing 737 フライトのヒント' : 'Cessna 172 フライトのヒント'}
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            {aircraft.type === 'boeing737' ? (
              <>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>離陸前にフラップを15-25度に設定し、N1を約90%に設定します</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>V1速度（約280km/h）に達したら、V2速度（約320km/h）で離陸します</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>巡航高度は10,000m程度、巡航速度は850km/h程度が目安です</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>アプローチ速度は260-300km/hで、フラップを段階的に展開します</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>着陸後はリバーススラスト（S押し続け）とブレーキで減速します</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>燃料消費量が多いため、効率的な飛行計画を立てましょう</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>離陸前にフラップを10-20度に設定し、フルスロットルで加速します</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>対気速度が100km/hを超えたら、ゆっくりと機首を上げて離陸します</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>安全な高度に達したら、ランディングギアを格納して抵抗を減らします</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>着陸時は早めに減速し、フラップを展開してランディングギアを下ろします</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>失速警告が出たら、機首を下げてスロットルを上げて速度を回復します</span>
                </li>
              </>
            )}
          </ul>
        </div>
        
        {/* ゲームパッド対応の説明 */}
        <div className="mt-4 text-center text-gray-500 text-sm">
          <p>Xbox/PlayStationコントローラーにも対応しています</p>
          <p>（左スティック: ピッチ/ロール、右スティック: カメラ、トリガー: スロットル）</p>
        </div>
      </div>
    </div>
  );
};
