import React, { Suspense, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useSimulatorStore } from '@/store/simulatorStore';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';
import { HUD } from '@/components/ui/HUD';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { MainMenu } from '@/components/ui/MainMenu';
import { PauseMenu } from '@/components/ui/PauseMenu';
import { InstrumentPanel } from '@/components/cockpit/InstrumentPanel';
import { MiniMap } from '@/components/ui/MiniMap';
import { ControlsHelp } from '@/components/ui/ControlsHelp';

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
  
  // ゲーム開始
  const handleStartGame = () => {
    setShowMainMenu(false);
    useSimulatorStore.getState().setPaused(false);
  };
  
  return (
    <>
      <Head>
        <title>WebFlight Simulator Pro</title>
        <meta name="description" content="ブラウザで動作する高品質なフライトシミュレーター" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
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
            
            {/* コックピット計器（コックピットビュー時のみ） */}
            {cameraView === 'cockpit' && <InstrumentPanel />}
            
            {/* ミニマップ */}
            {hudSettings.showMap && <MiniMap />}
            
            {/* ポーズメニュー */}
            {isPaused && !showMainMenu && <PauseMenu onResume={() => useSimulatorStore.getState().setPaused(false)} />}
            
            {/* ヘルプ画面 */}
            {showHelp && <ControlsHelp onClose={() => setShowHelp(false)} />}
            
            {/* ヘルプボタン */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="fixed bottom-4 right-4 bg-black/50 text-white px-3 py-2 rounded hover:bg-black/70 transition-colors"
            >
              <span className="text-sm">H キー: ヘルプ</span>
            </button>
          </>
        )}
        
        {/* メインメニュー */}
        {showMainMenu && <MainMenu onStart={handleStartGame} />}
        
        {/* ローディング画面 */}
        {isLoading && <LoadingScreen />}
      </main>
    </>
  );
}
