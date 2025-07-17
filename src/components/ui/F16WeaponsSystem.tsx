import React, { useState } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

interface Weapon {
  id: string;
  name: string;
  type: 'missile' | 'bomb' | 'gun';
  quantity: number;
  maxQuantity: number;
  armed: boolean;
}

export const F16WeaponsSystem: React.FC = () => {
  const { aircraft } = useSimulatorStore();
  const [selectedWeapon, setSelectedWeapon] = useState<string>('aim9');
  const [masterArm, setMasterArm] = useState(false);
  
  // F-16以外では表示しない
  if (aircraft.type !== 'f16') {
    return null;
  }
  
  // 武装システムの初期設定
  const [weapons] = useState<Weapon[]>([
    { id: 'aim9', name: 'AIM-9 Sidewinder', type: 'missile', quantity: 2, maxQuantity: 2, armed: false },
    { id: 'aim120', name: 'AIM-120 AMRAAM', type: 'missile', quantity: 4, maxQuantity: 4, armed: false },
    { id: 'agm65', name: 'AGM-65 Maverick', type: 'missile', quantity: 2, maxQuantity: 2, armed: false },
    { id: 'mk82', name: 'Mk 82 Bomb', type: 'bomb', quantity: 4, maxQuantity: 4, armed: false },
    { id: 'm61', name: 'M61 Vulcan', type: 'gun', quantity: 511, maxQuantity: 511, armed: true },
  ]);
  
  const currentWeapon = weapons.find(w => w.id === selectedWeapon);
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
      <div className="bg-black/80 rounded-lg p-4 border border-green-500/50 min-w-[400px]">
        {/* マスターアーム状態 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">MASTER ARM</span>
          <span className={`text-lg font-bold ${masterArm ? 'text-red-500' : 'text-green-500'}`}>
            {masterArm ? 'ARMED' : 'SAFE'}
          </span>
        </div>
        
        {/* 選択中の武器 */}
        <div className="mb-3">
          <div className="text-green-400 text-sm mb-1">SELECTED WEAPON</div>
          <div className="text-white text-lg font-bold">{currentWeapon?.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-400">QTY:</span>
            <span className="text-green-400 font-bold">{currentWeapon?.quantity}/{currentWeapon?.maxQuantity}</span>
          </div>
        </div>
        
        {/* 武器リスト */}
        <div className="grid grid-cols-5 gap-2">
          {weapons.map((weapon) => (
            <div
              key={weapon.id}
              className={`p-2 rounded border text-center text-xs ${
                selectedWeapon === weapon.id
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-gray-600 bg-gray-800/50'
              }`}
            >
              <div className="text-white font-semibold">{weapon.id.toUpperCase()}</div>
              <div className={`mt-1 ${weapon.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {weapon.quantity}
              </div>
            </div>
          ))}
        </div>
        
        {/* ターゲティングモード */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-gray-400">TARGETING MODE</span>
          <span className="text-sm text-green-400">BORE</span>
        </div>
        
        {/* 操作説明 */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          TAB: 武器切替 | SPACE: 発射 | M: マスターアーム
        </div>
      </div>
    </div>
  );
};