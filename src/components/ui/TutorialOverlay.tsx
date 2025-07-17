import React, { useEffect, useState } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

interface TutorialOverlayProps {
  onDismiss: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onDismiss }) => {
  const [visible, setVisible] = useState(true);
  const { aircraft } = useSimulatorStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 30000); // 30秒後に自動的に消える

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/90 text-white p-6 rounded-lg max-w-2xl pointer-events-auto">
        <h2 className="text-2xl font-bold mb-4">フライトの始め方</h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start">
            <span className="text-green-400 mr-2">1.</span>
            <span><kbd className="px-2 py-1 bg-gray-700 rounded text-xs">B</kbd> キーでブレーキを解除</span>
          </div>
          
          <div className="flex items-start">
            <span className="text-green-400 mr-2">2.</span>
            <span><kbd className="px-2 py-1 bg-gray-700 rounded text-xs">W</kbd> キーを押し続けてスロットルを上げる（100%まで）</span>
          </div>
          
          <div className="flex items-start">
            <span className="text-green-400 mr-2">3.</span>
            <span>速度が80-100km/hを超えたら <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">↓</kbd> キーでゆっくり機首を上げる</span>
          </div>
          
          <div className="flex items-start">
            <span className="text-green-400 mr-2">4.</span>
            <span>離陸したら <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">L</kbd> キーでランディングギアを格納</span>
          </div>
          
          <div className="flex items-start">
            <span className="text-green-400 mr-2">5.</span>
            <span><kbd className="px-2 py-1 bg-gray-700 rounded text-xs">←/→</kbd> キーで左右に旋回</span>
          </div>
        </div>
        
        <div className="mt-4 bg-yellow-900/50 p-3 rounded">
          <p className="text-yellow-300 text-xs">
            <strong>ヒント:</strong> 離陸前にフラップを <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">F</kbd> キーで
            10-20度展開すると、より低速で離陸できます
          </p>
        </div>
        
        {/* 現在の状態表示 */}
        <div className="mt-4 p-3 bg-gray-800 rounded">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-gray-400">速度:</span>
              <span className={`ml-2 font-mono ${aircraft.airspeed > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                {Math.round(aircraft.airspeed)} km/h
              </span>
            </div>
            <div>
              <span className="text-gray-400">スロットル:</span>
              <span className="ml-2 font-mono text-green-400">
                {Math.round(aircraft.throttle * 100)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400">ブレーキ:</span>
              <span className={`ml-2 font-mono ${aircraft.brakes ? 'text-red-400' : 'text-green-400'}`}>
                {aircraft.brakes ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <p className="text-xs text-gray-400">このメッセージは30秒後に自動的に消えます</p>
          <button
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors pointer-events-auto"
          >
            始める
          </button>
        </div>
      </div>
    </div>
  );
};
