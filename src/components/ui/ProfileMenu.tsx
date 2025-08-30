import React, { useState, useEffect } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { UserProfile } from '@/utils/storageManager';

interface ProfileMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ isVisible, onClose }) => {
  const {
    currentProfile,
    setCurrentProfile,
    createNewProfile,
    deleteProfile,
    getAllProfiles
  } = useSimulatorStore();
  
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  
  useEffect(() => {
    if (isVisible) {
      setProfiles(getAllProfiles());
    }
  }, [isVisible, getAllProfiles]);
  
  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;
    
    try {
      const newProfile = await createNewProfile(newProfileName.trim());
      setProfiles([...profiles, newProfile]);
      setNewProfileName('');
      setShowCreateForm(false);
    } catch (error) {
      alert('プロフィールの作成に失敗しました。');
    }
  };
  
  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('このプロフィールを削除しますか？フライト記録も失われます。')) {
      return;
    }
    
    const success = await deleteProfile(profileId);
    if (success) {
      setProfiles(profiles.filter(p => p.id !== profileId));
      if (currentProfile?.id === profileId) {
        setCurrentProfile(null);
      }
    }
  };
  
  const handleSelectProfile = (profile: UserProfile) => {
    setCurrentProfile(profile);
    setSelectedProfile(profile);
  };
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}時間${mins}分`;
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ja-JP');
  };

  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">プロフィール管理</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>
        
        {/* プロフィール一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={`bg-gray-800 rounded-lg p-4 border-2 transition-colors cursor-pointer ${
                currentProfile?.id === profile.id
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => handleSelectProfile(profile)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-white">{profile.name}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProfile(profile.id);
                  }}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  削除
                </button>
              </div>
              
              <div className="space-y-2 text-sm text-gray-300">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400">総フライト時間:</span>
                    <span className="text-white ml-1">{formatTime(profile.totalFlightTime)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">フライト回数:</span>
                    <span className="text-white ml-1">{profile.totalFlights}回</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400">最高着陸スコア:</span>
                    <span className="text-white ml-1">{profile.stats.bestLanding.toFixed(0)}点</span>
                  </div>
                  <div>
                    <span className="text-gray-400">最長フライト:</span>
                    <span className="text-white ml-1">{formatTime(profile.stats.longestFlight)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400">総飛行距離:</span>
                    <span className="text-white ml-1">{profile.stats.totalDistance.toFixed(0)}km</span>
                  </div>
                  <div>
                    <span className="text-gray-400">墜落回数:</span>
                    <span className="text-white ml-1">{profile.stats.crashCount}回</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    作成日: {formatDate(profile.createdAt)} | 
                    最終プレイ: {formatDate(profile.lastPlayed)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    愛用機: {
                      profile.preferences.defaultAircraft === 'cessna172' ? 'Cessna 172' :
                      profile.preferences.defaultAircraft === 'boeing737' ? 'Boeing 737' : 'F-16'
                    }
                  </div>
                </div>
                
                {profile.achievements.length > 0 && (
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-xs text-gray-400">実績: {profile.achievements.length}個</div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* 新規プロフィール作成カード */}
          <div
            className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
            onClick={() => setShowCreateForm(true)}
          >
            <div className="text-center">
              <div className="text-4xl text-gray-500 mb-2">+</div>
              <div className="text-gray-400">新しいプロフィール</div>
            </div>
          </div>
        </div>
        
        {/* プロフィール作成フォーム */}
        {showCreateForm && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-3">新しいプロフィールを作成</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="プロフィール名を入力"
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProfile()}
              />
              <button
                onClick={handleCreateProfile}
                disabled={!newProfileName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
              >
                作成
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewProfileName('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
        
        {/* 現在のプロフィール情報 */}
        {currentProfile && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-3">現在のプロフィール</h3>
            <div className="text-gray-300">
              <span className="text-blue-400 font-semibold">{currentProfile.name}</span> として
              プレイしています
            </div>
          </div>
        )}
        
        {/* アクションボタン */}
        <div className="flex justify-end space-x-3">
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