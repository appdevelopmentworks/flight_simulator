import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { storageManager } from '@/utils/storageManager';

interface PauseMenuProps {
  onResume: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume }) => {
  const { 
    gameSettings, 
    setGameSettings, 
    hudSettings, 
    setHUDSettings,
    resetAircraft,
    aircraft
  } = useSimulatorStore();
  
  const [activeTab, setActiveTab] = React.useState<'game' | 'controls' | 'graphics' | 'hud' | 'storage'>('game');
  const [exportData, setExportData] = React.useState<string>('');
  const [importData, setImportData] = React.useState<string>('');
  
  const handleRestart = () => {
    resetAircraft(aircraft.type);
    onResume();
  };

  const handleExportData = () => {
    const data = storageManager.exportData();
    setExportData(data);
    navigator.clipboard.writeText(data);
  };

  const handleImportData = async () => {
    if (!importData.trim()) return;
    
    const success = storageManager.importData(importData);
    if (success) {
      alert('データのインポートが完了しました。');
      window.location.reload(); // 設定を反映するためリロード
    } else {
      alert('データのインポートに失敗しました。');
    }
  };

  const handleClearData = () => {
    if (confirm('全てのデータを削除しますか？この操作は元に戻せません。')) {
      storageManager.clearAllData();
      alert('データが削除されました。');
      window.location.reload();
    }
  };
  
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">ポーズメニュー</h2>
          <button
            onClick={onResume}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>
        
        {/* タブ */}
        <div className="flex space-x-1 mb-6">
          {(['game', 'controls', 'graphics', 'hud', 'storage'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab === 'game' && 'ゲーム'}
              {tab === 'controls' && 'コントロール'}
              {tab === 'graphics' && 'グラフィック'}
              {tab === 'hud' && 'HUD'}
              {tab === 'storage' && 'データ'}
            </button>
          ))}
        </div>
        
        {/* タブコンテンツ */}
        <div className="bg-gray-800 rounded-lg p-6">
          {/* ゲーム設定 */}
          {activeTab === 'game' && (
            <div className="space-y-4">
              <div>
                <label className="text-white block mb-2">音量</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gameSettings.sound}
                  onChange={(e) => setGameSettings({ sound: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-gray-400 text-sm">{gameSettings.sound}%</span>
              </div>
              
              <div>
                <label className="text-white block mb-2">BGM音量</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gameSettings.music}
                  onChange={(e) => setGameSettings({ music: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-gray-400 text-sm">{gameSettings.music}%</span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-white font-semibold">アシスト機能</h3>
                {Object.entries(gameSettings.assists).map(([key, value]) => (
                  <label key={key} className="flex items-center text-gray-300">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setGameSettings({
                        assists: { ...gameSettings.assists, [key]: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    {key === 'autopilot' && 'オートパイロット'}
                    {key === 'landingGuide' && '着陸ガイド'}
                    {key === 'stallWarning' && '失速警告'}
                    {key === 'collisionWarning' && '衝突警告'}
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* コントロール設定 */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.controls.invertY}
                    onChange={(e) => setGameSettings({
                      controls: { ...gameSettings.controls, invertY: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  Y軸反転
                </label>
              </div>
              
              <div>
                <label className="text-white block mb-2">感度</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gameSettings.controls.sensitivity}
                  onChange={(e) => setGameSettings({
                    controls: { ...gameSettings.controls, sensitivity: Number(e.target.value) }
                  })}
                  className="w-full"
                />
                <span className="text-gray-400 text-sm">{gameSettings.controls.sensitivity}%</span>
              </div>
              
              <div>
                <label className="text-white block mb-2">デッドゾーン</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gameSettings.controls.deadzone}
                  onChange={(e) => setGameSettings({
                    controls: { ...gameSettings.controls, deadzone: Number(e.target.value) }
                  })}
                  className="w-full"
                />
                <span className="text-gray-400 text-sm">{gameSettings.controls.deadzone}%</span>
              </div>
            </div>
          )}
          
          {/* グラフィック設定 */}
          {activeTab === 'graphics' && (
            <div className="space-y-4">
              <div>
                <label className="text-white block mb-2">画質プリセット</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'ultra'] as const).map((quality) => (
                    <button
                      key={quality}
                      onClick={() => setGameSettings({ graphics: quality })}
                      className={`py-2 px-3 rounded border transition-colors ${
                        gameSettings.graphics === quality
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-gray-600 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {quality === 'low' && '低'}
                      {quality === 'medium' && '中'}
                      {quality === 'high' && '高'}
                      {quality === 'ultra' && '最高'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="text-gray-400 text-sm">
                <p>現在の設定:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>シャドウマップ: {gameSettings.graphics === 'low' ? '512' : gameSettings.graphics === 'medium' ? '1024' : gameSettings.graphics === 'high' ? '2048' : '4096'}</li>
                  <li>アンチエイリアス: {gameSettings.graphics !== 'low' ? '有効' : '無効'}</li>
                  <li>描画距離: {gameSettings.graphics === 'low' ? '5km' : gameSettings.graphics === 'medium' ? '10km' : gameSettings.graphics === 'high' ? '20km' : '50km'}</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* HUD設定 */}
          {activeTab === 'hud' && (
            <div className="space-y-3">
              {Object.entries(hudSettings).map(([key, value]) => (
                <label key={key} className="flex items-center text-gray-300">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setHUDSettings({ [key]: e.target.checked })}
                    className="mr-2"
                  />
                  {key === 'showAltitude' && '高度'}
                  {key === 'showAirspeed' && '対気速度'}
                  {key === 'showHeading' && '方位'}
                  {key === 'showVerticalSpeed' && '昇降率'}
                  {key === 'showFuel' && '燃料'}
                  {key === 'showMap' && 'ミニマップ'}
                </label>
              ))}
            </div>
          )}
          
          {/* データ管理設定 */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              {/* ストレージ情報 */}
              <div>
                <h3 className="text-white font-semibold mb-3">ストレージ情報</h3>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">使用量:</span>
                      <span className="text-white ml-2">{(storageManager.getStorageSize().used / 1024).toFixed(1)} KB</span>
                    </div>
                    <div>
                      <span className="text-gray-400">利用可能:</span>
                      <span className="text-white ml-2">{(storageManager.getStorageSize().available / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* データエクスポート */}
              <div>
                <h3 className="text-white font-semibold mb-3">データエクスポート</h3>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mb-2"
                >
                  設定をクリップボードにコピー
                </button>
                {exportData && (
                  <div className="mt-2">
                    <textarea
                      value={exportData}
                      readOnly
                      className="w-full h-24 bg-gray-700 text-white text-xs p-2 rounded border-gray-600"
                      placeholder="エクスポートされたデータがここに表示されます"
                    />
                    <p className="text-gray-400 text-xs mt-1">データがクリップボードにコピーされました</p>
                  </div>
                )}
              </div>
              
              {/* データインポート */}
              <div>
                <h3 className="text-white font-semibold mb-3">データインポート</h3>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="w-full h-24 bg-gray-700 text-white text-xs p-2 rounded border border-gray-600 mb-2"
                  placeholder="インポートするJSONデータを貼り付けてください"
                />
                <button
                  onClick={handleImportData}
                  disabled={!importData.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  データをインポート
                </button>
              </div>
              
              {/* 危険な操作 */}
              <div>
                <h3 className="text-red-400 font-semibold mb-3">危険な操作</h3>
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  全データを削除
                </button>
                <p className="text-gray-400 text-xs mt-1">
                  設定、プロフィール、フライト記録など全てのデータが削除されます
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* アクションボタン */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleRestart}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            リスタート
          </button>
          
          <div className="space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              メインメニューへ
            </button>
            
            <button
              onClick={onResume}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              再開
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
