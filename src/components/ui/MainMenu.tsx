import React, { useState } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { AircraftType } from '@/types';

interface MainMenuProps {
  onStart: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  const { resetAircraft, setGameSettings, setWeather } = useSimulatorStore();
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftType>('cessna172');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'normal' | 'hard' | 'realistic'>('normal');
  const [selectedWeather, setSelectedWeather] = useState<'clear' | 'cloudy' | 'rainy' | 'stormy'>('clear');
  
  const handleStart = () => {
    // 選択された航空機でリセット
    resetAircraft(selectedAircraft);
    
    // 難易度設定
    setGameSettings({ difficulty: selectedDifficulty });
    
    // 天候設定
    switch (selectedWeather) {
      case 'clear':
        setWeather({
          windSpeed: 2,
          cloudCover: 0.1,
          precipitation: 'none',
          visibility: 10,
        });
        break;
      case 'cloudy':
        setWeather({
          windSpeed: 5,
          cloudCover: 0.7,
          precipitation: 'none',
          visibility: 8,
        });
        break;
      case 'rainy':
        setWeather({
          windSpeed: 8,
          cloudCover: 0.9,
          precipitation: 'rain',
          visibility: 3,
        });
        break;
      case 'stormy':
        setWeather({
          windSpeed: 15,
          cloudCover: 1,
          precipitation: 'rain',
          visibility: 1,
          turbulence: 0.8,
        });
        break;
    }
    
    onStart();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
        {/* タイトル */}
        <h1 className="text-5xl font-bold text-center text-white mb-2 font-digital">
          WebFlight Simulator Pro
        </h1>
        <p className="text-center text-gray-400 mb-8">
          リアルな飛行体験をブラウザで
        </p>
        
        {/* 航空機選択 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-3">航空機を選択</h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedAircraft('cessna172')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedAircraft === 'cessna172'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <h3 className="text-white font-semibold">Cessna 172</h3>
              <p className="text-gray-400 text-sm mt-1">初心者向け</p>
              <p className="text-gray-500 text-xs mt-2">
                最高速度: 302 km/h<br />
                航続距離: 1,272 km
              </p>
            </button>
            
            <button
              onClick={() => setSelectedAircraft('boeing737')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedAircraft === 'boeing737'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <h3 className="text-white font-semibold">Boeing 737</h3>
              <p className="text-gray-400 text-sm mt-1">中級者向け</p>
              <p className="text-gray-500 text-xs mt-2">
                最高速度: 876 km/h<br />
                航続距離: 5,765 km
              </p>
            </button>
            
            <button
              onClick={() => setSelectedAircraft('f16')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedAircraft === 'f16'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <h3 className="text-white font-semibold">F-16 Fighting Falcon</h3>
              <p className="text-gray-400 text-sm mt-1">上級者向け</p>
              <p className="text-gray-500 text-xs mt-2">
                最高速度: 2,120 km/h<br />
                戦闘行動半径: 550 km
              </p>
            </button>
          </div>
        </div>
        
        {/* 難易度選択 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-3">難易度</h2>
          <div className="grid grid-cols-4 gap-3">
            {(['easy', 'normal', 'hard', 'realistic'] as const).map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty)}
                className={`py-2 px-4 rounded-lg border transition-all ${
                  selectedDifficulty === difficulty
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* 天候選択 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">天候</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: 'clear', label: '快晴', icon: '☀️' },
              { id: 'cloudy', label: '曇り', icon: '☁️' },
              { id: 'rainy', label: '雨', icon: '🌧️' },
              { id: 'stormy', label: '嵐', icon: '⛈️' },
            ].map((weather) => (
              <button
                key={weather.id}
                onClick={() => setSelectedWeather(weather.id as any)}
                className={`py-3 px-4 rounded-lg border transition-all ${
                  selectedWeather === weather.id
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{weather.icon}</div>
                <div className="text-sm">{weather.label}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* スタートボタン */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-xl shadow-lg"
        >
          フライトを開始
        </button>
        
        {/* 操作説明 */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Hキーでヘルプ表示 | ESCキーでポーズ</p>
        </div>
      </div>
    </div>
  );
};
