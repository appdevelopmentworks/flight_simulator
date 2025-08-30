import React, { useState, useEffect } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { storageManager, FlightRecord } from '@/utils/storageManager';

interface FlightRecorderProps {
  isVisible: boolean;
  onClose: () => void;
}

export const FlightRecorder: React.FC<FlightRecorderProps> = ({ isVisible, onClose }) => {
  const {
    currentProfile,
    currentFlightRecord,
    startFlightRecording,
    stopFlightRecording
  } = useSimulatorStore();
  
  const [flightRecords, setFlightRecords] = useState<FlightRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<FlightRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'current'>('records');

  useEffect(() => {
    if (isVisible && currentProfile) {
      const records = storageManager.getFlightRecordsByProfile(currentProfile.id);
      setFlightRecords(records.sort((a, b) => b.startTime - a.startTime));
    }
  }, [isVisible, currentProfile]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP');
  };

  const getAircraftName = (type: string) => {
    switch (type) {
      case 'cessna172': return 'Cessna 172';
      case 'boeing737': return 'Boeing 737';
      case 'f16': return 'F-16';
      default: return type;
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    if (confirm('このフライト記録を削除しますか？')) {
      const success = storageManager.deleteFlightRecord(recordId);
      if (success) {
        setFlightRecords(records => records.filter(r => r.id !== recordId));
        if (selectedRecord?.id === recordId) {
          setSelectedRecord(null);
        }
      }
    }
  };

  const handleExportRecord = (record: FlightRecord) => {
    const exportData = JSON.stringify(record, null, 2);
    navigator.clipboard.writeText(exportData);
    alert('フライト記録をクリップボードにコピーしました');
  };

  const handleStartRecording = () => {
    startFlightRecording();
    setActiveTab('current');
  };

  const handleStopRecording = () => {
    stopFlightRecording(undefined, false); // 通常の終了
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">フライトレコーダー</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {!currentProfile && (
          <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 mb-6">
            <div className="text-yellow-400">
              フライト記録を使用するには、プロフィールを作成してください。
            </div>
          </div>
        )}

        {currentProfile && (
          <>
            {/* タブ */}
            <div className="flex space-x-1 mb-6">
              {(['records', 'current'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-t-lg transition-colors ${
                    activeTab === tab
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tab === 'records' && 'フライト記録'}
                  {tab === 'current' && '現在の記録'}
                </button>
              ))}
            </div>

            {/* フライト記録タブ */}
            {activeTab === 'records' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 記録リスト */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">
                      記録一覧 ({flightRecords.length}件)
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {flightRecords.map((record) => (
                      <div
                        key={record.id}
                        className={`bg-gray-800 rounded-lg p-4 cursor-pointer border-2 transition-colors ${
                          selectedRecord?.id === record.id
                            ? 'border-blue-500'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                        onClick={() => setSelectedRecord(record)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-white font-semibold">
                              {getAircraftName(record.aircraftType)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {formatDate(record.startTime)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-white">
                              {formatDuration(record.duration)}
                            </div>
                            {record.crashed && (
                              <div className="text-xs text-red-400">墜落</div>
                            )}
                            {record.landingScore && (
                              <div className="text-xs text-green-400">
                                着陸: {record.landingScore.toFixed(0)}点
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                          <div>
                            <span>距離: </span>
                            <span className="text-white">{record.totalDistance.toFixed(0)}km</span>
                          </div>
                          <div>
                            <span>最高高度: </span>
                            <span className="text-white">{Math.floor(record.maxAltitude)}m</span>
                          </div>
                          <div>
                            <span>最高速度: </span>
                            <span className="text-white">{Math.floor(record.maxSpeed)}km/h</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {flightRecords.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        フライト記録がありません。<br />
                        フライトを開始して記録を作成してください。
                      </div>
                    )}
                  </div>
                </div>

                {/* 記録詳細 */}
                <div>
                  {selectedRecord ? (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">記録詳細</h3>
                        <div className="space-x-2">
                          <button
                            onClick={() => handleExportRecord(selectedRecord)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                          >
                            エクスポート
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(selectedRecord.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* 基本情報 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-gray-400 text-sm">航空機</div>
                            <div className="text-white">{getAircraftName(selectedRecord.aircraftType)}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-sm">飛行時間</div>
                            <div className="text-white">{formatDuration(selectedRecord.duration)}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-sm">開始時刻</div>
                            <div className="text-white">{formatDate(selectedRecord.startTime)}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-sm">終了時刻</div>
                            <div className="text-white">{formatDate(selectedRecord.endTime)}</div>
                          </div>
                        </div>

                        {/* 飛行データ */}
                        <div className="border-t border-gray-700 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-gray-400 text-sm">総飛行距離</div>
                              <div className="text-white">{selectedRecord.totalDistance.toFixed(1)} km</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-sm">燃料消費量</div>
                              <div className="text-white">{selectedRecord.fuelUsed.toFixed(0)} L</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-sm">最高高度</div>
                              <div className="text-white">{Math.floor(selectedRecord.maxAltitude)} m</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-sm">最高速度</div>
                              <div className="text-white">{Math.floor(selectedRecord.maxSpeed)} km/h</div>
                            </div>
                          </div>
                        </div>

                        {/* 着陸スコア */}
                        {selectedRecord.landingScore && (
                          <div className="border-t border-gray-700 pt-4">
                            <div className="text-gray-400 text-sm">着陸スコア</div>
                            <div className="text-green-400 text-xl font-bold">
                              {selectedRecord.landingScore.toFixed(0)} 点
                            </div>
                          </div>
                        )}

                        {/* 墜落情報 */}
                        {selectedRecord.crashed && (
                          <div className="border-t border-gray-700 pt-4">
                            <div className="text-red-400 font-semibold">墜落</div>
                            <div className="text-gray-400 text-sm">
                              このフライトは墜落で終了しました
                            </div>
                          </div>
                        )}

                        {/* 天候情報 */}
                        <div className="border-t border-gray-700 pt-4">
                          <div className="text-gray-400 text-sm mb-2">天候条件</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">風速: </span>
                              <span className="text-white">{selectedRecord.weather.windSpeed} km/h</span>
                            </div>
                            <div>
                              <span className="text-gray-400">視程: </span>
                              <span className="text-white">{selectedRecord.weather.visibility} km</span>
                            </div>
                            <div>
                              <span className="text-gray-400">雲量: </span>
                              <span className="text-white">{Math.floor(selectedRecord.weather.cloudCover * 100)}%</span>
                            </div>
                            <div>
                              <span className="text-gray-400">降水: </span>
                              <span className="text-white">
                                {selectedRecord.weather.precipitation === 'none' ? 'なし' : 
                                 selectedRecord.weather.precipitation === 'rain' ? '雨' : '雪'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* テレメトリ情報 */}
                        <div className="border-t border-gray-700 pt-4">
                          <div className="text-gray-400 text-sm">
                            テレメトリポイント: {selectedRecord.telemetry.length}件
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                      記録を選択してください
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 現在の記録タブ */}
            {activeTab === 'current' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">現在の記録状態</h3>

                {currentFlightRecord ? (
                  <div className="space-y-4">
                    <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                      <div className="text-green-400 font-semibold mb-2">
                        🔴 記録中
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">航空機</div>
                          <div className="text-white">{getAircraftName(currentFlightRecord.aircraftType)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">開始時刻</div>
                          <div className="text-white">{formatDate(currentFlightRecord.startTime)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">経過時間</div>
                          <div className="text-white">
                            {formatDuration((Date.now() - currentFlightRecord.startTime) / 60000)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">テレメトリ</div>
                          <div className="text-white">{currentFlightRecord.telemetry.length} ポイント</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-gray-400 text-sm">現在の最高高度</div>
                        <div className="text-white text-xl">{Math.floor(currentFlightRecord.maxAltitude)} m</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">現在の最高速度</div>
                        <div className="text-white text-xl">{Math.floor(currentFlightRecord.maxSpeed)} km/h</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleStopRecording}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        記録を停止
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      現在フライト記録は開始されていません
                    </div>
                    <button
                      onClick={handleStartRecording}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      記録を開始
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 閉じるボタン */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};