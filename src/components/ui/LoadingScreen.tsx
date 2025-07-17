import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
      <div className="text-center">
        {/* ローディングアニメーション */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          
          {/* 航空機アイコン */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21,16v-2l-8-5V3.5C13,2.67,12.33,2,11.5,2S10,2.67,10,3.5V9l-8,5v2l8-2.5V19l-2,1.5V22l3.5-1l3.5,1v-1.5L13,19v-5.5L21,16z"/>
            </svg>
          </div>
        </div>
        
        {/* タイトル */}
        <h1 className="text-4xl font-bold text-white mb-4 font-digital">
          WebFlight Simulator Pro
        </h1>
        
        {/* ローディングテキスト */}
        <p className="text-gray-400 mb-2">システムを初期化中...</p>
        
        {/* プログレスバー */}
        <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
        
        {/* ヒント */}
        <div className="mt-8 text-sm text-gray-500 max-w-md mx-auto">
          <p>💡 ヒント: 矢印キーで操縦、W/Sキーでスロットル操作ができます</p>
        </div>
      </div>
    </div>
  );
};
