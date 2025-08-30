'use client';

import React, { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSimulatorStore } from '@/store/simulatorStore';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';
import { useEngineSound } from '@/hooks/useEngineSound';
import { HUD } from '@/components/ui/HUD';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { MainMenu } from '@/components/ui/MainMenu';
import { PauseMenu } from '@/components/ui/PauseMenu';
import { InstrumentPanel } from '@/components/cockpit/InstrumentPanel';
import { MiniMap } from '@/components/ui/MiniMap';
import { ControlsHelp } from '@/components/ui/ControlsHelp';
import { TutorialOverlay } from '@/components/ui/TutorialOverlay';
import { DebugInfo } from '@/components/ui/DebugInfo';
import { QuickActions } from '@/components/ui/QuickActions';
import { GForceEffects } from '@/components/ui/GForceEffects';
import { F16WeaponsSystem } from '@/components/ui/F16WeaponsSystem';

// Three.jsのSceneコンポーネントを動的インポート（SSR対策）
const Scene = dynamic(() => import('@/components/Scene').then(mod => ({ default: mod.Scene })), {
  ssr: false,
  loading: () => <LoadingScreen />
});

export default function Home() {
  const { 
    isLoading, 
    setLoading, 
    isPaused,
    cameraView,
    hudSettings,
    gameSettings 
  } = useSimulatorStore();
  
  // キーボードコントロールの初期化
  useKeyboardControls();
  
  // エンジン音の初期化
  useEngineSound();
  
  // 初期化処理
  useEffect(() => {
    // リソースの読み込みなど
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [setLoading]);
  
  // メインメニューの表示状態
  const [showMainMenu, setShowMainMenu] = React.useState(true);
  const [showHelp, setShowHelp] = React.useState(false);
  const [showTutorial, setShowTutorial] = React.useState(false);
  
  // ゲーム開始
  const handleStartGame = () => {
    setShowMainMenu(false);
    setShowTutorial(true);
    useSimulatorStore.getState().setPaused(false);
  };
  
  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {/* 3Dシーン */}
      <Suspense fallback={<LoadingScreen />}>
        <Scene />
      </Suspense>
      
      {/* UI オーバーレイ */}
      {!showMainMenu && (
        <>
          {/* HUD */}
          <HUD />
          
          {/* G力効果 */}
          <GForceEffects />
          
          {/* F-16武装システム */}
          <F16WeaponsSystem />
          
          {/* コックピット計器（コックピットビュー時のみ） */}
          {cameraView === 'cockpit' && <InstrumentPanel />}
          
          {/* ミニマップ */}
          {hudSettings.showMap && <MiniMap />}
          
          {/* ポーズメニュー */}
          {isPaused && !showMainMenu && <PauseMenu onResume={() => useSimulatorStore.getState().setPaused(false)} />}
          
          {/* ヘルプ画面 */}
          {showHelp && <ControlsHelp onClose={() => setShowHelp(false)} />}
          
          {/* チュートリアル */}
          {showTutorial && <TutorialOverlay onDismiss={() => setShowTutorial(false)} />}
          
          {/* デバッグ情報 */}
          <DebugInfo />
          
          {/* クイックアクション */}
          <QuickActions />
          
          {/* ヘルプボタン */}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="fixed bottom-4 right-4 bg-black/50 text-white px-3 py-2 rounded hover:bg-black/70 transition-colors touch-optimized md:px-3 md:py-2 px-4 py-3"
          >
            <span className="text-sm md:inline hidden">H キー: ヘルプ</span>
            <span className="text-sm md:hidden">?</span>
          </button>
        </>
      )}
      
      {/* メインメニュー */}
      {showMainMenu && <MainMenu onStart={handleStartGame} />}
      
      {/* ローディング画面 */}
      {isLoading && <LoadingScreen />}
    </main>
  );
}
