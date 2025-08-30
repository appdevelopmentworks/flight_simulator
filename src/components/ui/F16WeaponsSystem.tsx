import React, { useState, useEffect } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { audioSystem } from '@/systems/AudioSystem';
import * as THREE from 'three';

interface Weapon {
  id: string;
  name: string;
  type: 'missile' | 'bomb' | 'gun';
  quantity: number;
  maxQuantity: number;
  armed: boolean;
  range: number; // 射程距離（km）
  damage: number; // ダメージ値
}

interface Target {
  id: string;
  position: THREE.Vector3;
  type: 'aircraft' | 'ground';
  locked: boolean;
  distance: number;
  bearing: number;
}

interface Projectile {
  id: string;
  weaponType: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  target?: Target;
  launchTime: number;
  maxRange: number;
}

export const F16WeaponsSystem: React.FC = () => {
  const { aircraft } = useSimulatorStore();
  const [selectedWeapon, setSelectedWeapon] = useState<string>('aim9');
  const [masterArm, setMasterArm] = useState(false);
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [radarMode, setRadarMode] = useState<'air' | 'ground'>('air');
  const [lockingTarget, setLockingTarget] = useState<string | null>(null);
  
  // 武装システムの初期設定
  const [weapons, setWeapons] = useState<Weapon[]>([
    { id: 'aim9', name: 'AIM-9 Sidewinder', type: 'missile', quantity: 2, maxQuantity: 2, armed: false, range: 18, damage: 100 },
    { id: 'aim120', name: 'AIM-120 AMRAAM', type: 'missile', quantity: 4, maxQuantity: 4, armed: false, range: 160, damage: 120 },
    { id: 'agm65', name: 'AGM-65 Maverick', type: 'missile', quantity: 2, maxQuantity: 2, armed: false, range: 30, damage: 200 },
    { id: 'mk82', name: 'Mk 82 Bomb', type: 'bomb', quantity: 4, maxQuantity: 4, armed: false, range: 5, damage: 300 },
    { id: 'm61', name: 'M61 Vulcan', type: 'gun', quantity: 511, maxQuantity: 511, armed: true, range: 2, damage: 10 },
  ]);
  
  // ターゲット検索とロック機能
  useEffect(() => {
    const scanForTargets = () => {
      // 模擬ターゲットを生成（実際の実装では他の航空機や地上目標）
      const mockTargets: Target[] = [];
      
      if (radarMode === 'air') {
        // 空中目標を生成
        for (let i = 0; i < 3; i++) {
          const angle = (i * 120) * (Math.PI / 180); // 120度間隔
          const distance = 20 + Math.random() * 80; // 20-100km
          const targetPos = new THREE.Vector3(
            aircraft.position.x + Math.cos(angle) * distance * 1000,
            aircraft.position.y + (Math.random() - 0.5) * 5000,
            aircraft.position.z + Math.sin(angle) * distance * 1000
          );
          
          mockTargets.push({
            id: `air_${i}`,
            position: targetPos,
            type: 'aircraft',
            locked: false,
            distance,
            bearing: (angle * 180 / Math.PI + 360) % 360
          });
        }
      } else {
        // 地上目標を生成
        for (let i = 0; i < 5; i++) {
          const angle = (i * 72) * (Math.PI / 180); // 72度間隔
          const distance = 10 + Math.random() * 40; // 10-50km
          const targetPos = new THREE.Vector3(
            aircraft.position.x + Math.cos(angle) * distance * 1000,
            0, // 地上レベル
            aircraft.position.z + Math.sin(angle) * distance * 1000
          );
          
          mockTargets.push({
            id: `ground_${i}`,
            position: targetPos,
            type: 'ground',
            locked: false,
            distance,
            bearing: (angle * 180 / Math.PI + 360) % 360
          });
        }
      }
      
      setTargets(mockTargets);
    };
    
    const interval = setInterval(scanForTargets, 2000); // 2秒ごとにスキャン
    scanForTargets(); // 初回実行
    
    return () => clearInterval(interval);
  }, [aircraft.position, radarMode]);
  
  // 弾薬の更新
  useEffect(() => {
    const updateProjectiles = () => {
      setProjectiles(prev => {
        return prev.filter(projectile => {
          const elapsed = Date.now() - projectile.launchTime;
          const maxFlightTime = projectile.maxRange * 1000 / 300; // 約300m/s平均速度
          
          // 最大射程時間を超えたら削除
          if (elapsed > maxFlightTime * 1000) {
            return false;
          }
          
          // 目標に到達した場合
          if (projectile.target) {
            const currentDistance = projectile.position.distanceTo(projectile.target.position);
            if (currentDistance < 100) { // 100m以内で着弾
              audioSystem.addATCMessage(`Target destroyed!`, 'medium');
              return false;
            }
          }
          
          return true;
        });
      });
    };
    
    const interval = setInterval(updateProjectiles, 100);
    return () => clearInterval(interval);
  }, []);
  
  // キーボード操作
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (aircraft.type !== 'f16') return;
      
      switch (event.key.toLowerCase()) {
        case 'm':
          // マスターアーム切り替え
          setMasterArm(prev => {
            const newState = !prev;
            audioSystem.addATCMessage(newState ? "Master arm ON" : "Master arm SAFE", 'low');
            return newState;
          });
          break;
        case 'r':
          // レーダーモード切り替え
          setRadarMode(prev => prev === 'air' ? 'ground' : 'air');
          break;
        case 't':
          // 次のターゲットを選択
          if (targets.length > 0) {
            const currentIndex = selectedTarget ? targets.findIndex(t => t.id === selectedTarget.id) : -1;
            const nextIndex = (currentIndex + 1) % targets.length;
            setSelectedTarget(targets[nextIndex]);
            setLockingTarget(targets[nextIndex].id);
            setTimeout(() => setLockingTarget(null), 2000); // 2秒後にロック完了
          }
          break;
        case ' ':
          // 武器発射
          if (event.ctrlKey) {
            event.preventDefault();
            fireWeapon();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [aircraft.type, targets, selectedTarget, masterArm, selectedWeapon]);
  
  // 武器発射機能
  const fireWeapon = () => {
    if (!masterArm) {
      audioSystem.addATCMessage("Master arm not armed!", 'medium');
      return;
    }
    
    const weapon = weapons.find(w => w.id === selectedWeapon);
    if (!weapon || weapon.quantity <= 0) {
      audioSystem.addATCMessage("No weapons available!", 'medium');
      return;
    }
    
    if (weapon.type === 'missile' && !selectedTarget) {
      audioSystem.addATCMessage("No target selected!", 'medium');
      return;
    }
    
    // 武器を発射
    const projectile: Projectile = {
      id: `proj_${Date.now()}`,
      weaponType: weapon.id,
      position: aircraft.position.clone(),
      velocity: new THREE.Vector3(0, 0, -200), // 初期速度
      target: selectedTarget || undefined,
      launchTime: Date.now(),
      maxRange: weapon.range
    };
    
    setProjectiles(prev => [...prev, projectile]);
    
    // 弾薬減少
    setWeapons(prev => prev.map(w => 
      w.id === selectedWeapon 
        ? { ...w, quantity: w.quantity - 1 }
        : w
    ));
    
    // 音声通知
    audioSystem.addATCMessage(`${weapon.name} fired!`, 'medium');
    audioSystem.playSound('weapon_fire', { volume: 0.5 });
  };
  
  const currentWeapon = weapons.find(w => w.id === selectedWeapon);
  
  // F-16以外では表示しない
  if (aircraft.type !== 'f16') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
      <div className="bg-black/90 rounded-lg p-4 border border-green-500/50 min-w-[500px] font-mono">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-green-400 text-lg font-bold">F-16 WEAPONS SYSTEM</div>
          <div className="flex gap-4">
            <div className={`px-2 py-1 text-xs rounded ${radarMode === 'air' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
              AIR
            </div>
            <div className={`px-2 py-1 text-xs rounded ${radarMode === 'ground' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
              GND
            </div>
          </div>
        </div>

        {/* マスターアーム状態 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">MASTER ARM</span>
          <span className={`text-lg font-bold ${masterArm ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
            {masterArm ? 'ARMED' : 'SAFE'}
          </span>
        </div>

        {/* ターゲット情報 */}
        {selectedTarget && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded">
            <div className="text-red-400 text-sm font-bold">TARGET LOCKED</div>
            <div className="flex justify-between text-xs text-white mt-1">
              <span>ID: {selectedTarget.id}</span>
              <span>RNG: {selectedTarget.distance.toFixed(1)}km</span>
              <span>BRG: {selectedTarget.bearing.toFixed(0)}°</span>
            </div>
            {lockingTarget === selectedTarget.id && (
              <div className="text-yellow-400 text-xs animate-pulse mt-1">LOCKING...</div>
            )}
          </div>
        )}

        {/* 選択中の武器 */}
        <div className="mb-3">
          <div className="text-green-400 text-sm mb-1">SELECTED WEAPON</div>
          <div className="text-white text-lg font-bold">{currentWeapon?.name}</div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">QTY: <span className="text-green-400 font-bold">{currentWeapon?.quantity}/{currentWeapon?.maxQuantity}</span></span>
            <span className="text-gray-400">RNG: <span className="text-green-400 font-bold">{currentWeapon?.range}km</span></span>
            <span className="text-gray-400">DMG: <span className="text-green-400 font-bold">{currentWeapon?.damage}</span></span>
          </div>
        </div>

        {/* 武器リスト */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          {weapons.map((weapon) => (
            <button
              key={weapon.id}
              onClick={() => setSelectedWeapon(weapon.id)}
              className={`p-2 rounded border text-center text-xs pointer-events-auto transition-all ${
                selectedWeapon === weapon.id
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-400'
              }`}
            >
              <div className="text-white font-semibold">{weapon.id.toUpperCase()}</div>
              <div className={`mt-1 ${weapon.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {weapon.quantity}
              </div>
            </button>
          ))}
        </div>

        {/* ターゲットリスト */}
        {targets.length > 0 && (
          <div className="mb-3">
            <div className="text-green-400 text-sm mb-1">TARGETS ({targets.length})</div>
            <div className="max-h-20 overflow-y-auto">
              {targets.slice(0, 3).map((target) => (
                <div
                  key={target.id}
                  className={`text-xs p-1 rounded mb-1 cursor-pointer pointer-events-auto ${
                    selectedTarget?.id === target.id
                      ? 'bg-red-500/20 border border-red-500/30'
                      : 'bg-gray-700/50 hover:bg-gray-600/50'
                  }`}
                  onClick={() => setSelectedTarget(target)}
                >
                  <span className="text-white">{target.id}</span>
                  <span className="text-gray-400 ml-2">{target.distance.toFixed(1)}km</span>
                  <span className="text-gray-400 ml-2">{target.bearing.toFixed(0)}°</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 発射中の弾薬 */}
        {projectiles.length > 0 && (
          <div className="mb-3">
            <div className="text-yellow-400 text-sm mb-1">MISSILES IN FLIGHT ({projectiles.length})</div>
            <div className="text-xs text-gray-400">
              {projectiles.map(p => p.weaponType.toUpperCase()).join(', ')}
            </div>
          </div>
        )}

        {/* 操作説明 */}
        <div className="text-xs text-gray-500 text-center border-t border-gray-700 pt-2">
          M: Master Arm | R: Radar Mode | T: Next Target | Ctrl+Space: Fire | Click: Select Weapon/Target
        </div>
      </div>
    </div>
  );
};