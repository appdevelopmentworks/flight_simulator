import React, { useState } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { UI_CONSTANTS } from '@/constants';
import { F16HUD } from './F16HUD';
import { WeatherRadar } from './WeatherRadar';
import { NavigationDisplay } from './NavigationDisplay';

export const HUD: React.FC = () => {
  const { aircraft, hudSettings, gameSettings } = useSimulatorStore();
  const [showWeatherRadar, setShowWeatherRadar] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  
  // F-16の場合は専用HUDを使用
  if (aircraft.type === 'f16') {
    return <F16HUD />;
  }
  
  if (!hudSettings.showAltitude && !hudSettings.showAirspeed && !hudSettings.showHeading && !hudSettings.showVerticalSpeed && !hudSettings.showFuel) {
    return null;
  }
  
  const fuelPercentage = (aircraft.fuel / 212) * 100; // セスナ172の燃料容量で計算
  const isLowFuel = fuelPercentage < UI_CONSTANTS.WARNING_THRESHOLD.LOW_FUEL;
  const isNearStall = aircraft.airspeed < 100; // 簡略化した失速警告
  
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none" role="region" aria-label="HUD flight information display">
      <div className="relative w-full h-full">
        {/* 左上: 速度と高度 */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 space-y-1 md:space-y-2">
          {hudSettings.showAirspeed && (
            <div className="hud-text bg-black/50 px-2 py-1 md:px-3 md:py-1 rounded">
              <span className="text-xs opacity-70">IAS</span>
              <div className={`text-lg md:text-2xl font-bold ${isNearStall ? 'warning-text' : ''}`}>
                {Math.round(aircraft.airspeed)} <span className="text-xs md:text-sm">km/h</span>
              </div>
            </div>
          )}
          
          {hudSettings.showAltitude && (
            <div className="hud-text bg-black/50 px-2 py-1 md:px-3 md:py-1 rounded">
              <span className="text-xs opacity-70">ALT</span>
              <div className="text-lg md:text-2xl font-bold">
                {Math.round(aircraft.altitude)} <span className="text-xs md:text-sm">m</span>
              </div>
            </div>
          )}
          
          {hudSettings.showVerticalSpeed && (
            <div className="hud-text bg-black/50 px-2 py-1 md:px-3 md:py-1 rounded mobile-hidden">
              <span className="text-xs opacity-70">V/S</span>
              <div className="text-lg font-bold">
                {aircraft.verticalSpeed > 0 ? '+' : ''}{aircraft.verticalSpeed.toFixed(1)} <span className="text-sm">m/s</span>
              </div>
            </div>
          )}
        </div>
        
        {/* 右上: 燃料とエンジン情報 */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 space-y-1 md:space-y-2">
          {hudSettings.showFuel && (
            <div className="hud-text bg-black/50 px-2 py-1 md:px-3 md:py-1 rounded text-right">
              <span className="text-xs opacity-70">FUEL</span>
              <div className={`text-lg md:text-xl font-bold ${isLowFuel ? 'warning-text' : ''}`}>
                {fuelPercentage.toFixed(1)}%
              </div>
              <div className="text-xs opacity-70 mobile-hidden">
                {aircraft.fuel.toFixed(1)} L
              </div>
            </div>
          )}
          
          <div className="hud-text bg-black/50 px-2 py-1 md:px-3 md:py-1 rounded text-right mobile-hidden">
            <span className="text-xs opacity-70">RPM</span>
            <div className="text-lg md:text-xl font-bold">
              {Math.round(aircraft.engineRPM)}
            </div>
          </div>
          
          <div className="hud-text bg-black/50 px-2 py-1 md:px-3 md:py-1 rounded text-right mobile-hidden">
            <span className="text-xs opacity-70">THR</span>
            <div className="text-lg md:text-xl font-bold">
              {Math.round(aircraft.throttle * 100)}%
            </div>
          </div>
        </div>
        
        {/* 上部中央: コンパス */}
        {hudSettings.showHeading && (
          <div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2">
            <div className="hud-text bg-black/50 px-2 py-1 md:px-4 md:py-2 rounded">
              <div className="text-xl md:text-3xl font-bold text-center">
                {Math.round(aircraft.heading).toString().padStart(3, '0')}°
              </div>
              <div className="flex justify-center mt-1 space-x-2 text-xs opacity-70 mobile-hidden">
                <span>N</span>
                <span>E</span>
                <span>S</span>
                <span>W</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 下部: ステータス情報 */}
        <div className="absolute bottom-16 md:bottom-4 left-2 md:left-4 space-y-1">
          {aircraft.landingGear && (
            <div className="hud-text bg-black/50 px-2 py-1 rounded text-xs md:text-sm">
              GEAR
            </div>
          )}
          
          {aircraft.flaps > 0 && (
            <div className="hud-text bg-black/50 px-2 py-1 rounded text-xs md:text-sm mobile-hidden">
              FLAPS {Math.round(aircraft.flaps)}°
            </div>
          )}
          
          {aircraft.brakes && (
            <div className="hud-text bg-black/50 px-2 py-1 rounded text-xs md:text-sm warning-text">
              BRK
            </div>
          )}
          
          {gameSettings.assists.autopilot && (
            <div className="hud-text bg-black/50 px-2 py-1 rounded text-xs md:text-sm text-blue-400">
              AP
            </div>
          )}
        </div>
        
        {/* 警告メッセージ */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 space-y-2">
          {isNearStall && gameSettings.assists.stallWarning && (
            <div className="danger-text bg-black/70 px-4 py-2 rounded text-center">
              ⚠️ STALL WARNING ⚠️
            </div>
          )}
          
          {isLowFuel && (
            <div className="warning-text bg-black/70 px-4 py-2 rounded text-center">
              ⚠️ LOW FUEL ⚠️
            </div>
          )}
          
          {aircraft.altitude < UI_CONSTANTS.WARNING_THRESHOLD.LOW_ALTITUDE && 
           aircraft.verticalSpeed < 0 && 
           gameSettings.assists.collisionWarning && (
            <div className="danger-text bg-black/70 px-4 py-2 rounded text-center">
              ⚠️ TERRAIN! PULL UP! ⚠️
            </div>
          )}
        </div>
        
        {/* 中央の十字線（コックピットビュー用） */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="absolute w-12 h-0.5 bg-green-400/50 -left-6 top-0"></div>
            <div className="absolute w-0.5 h-12 bg-green-400/50 left-0 -top-6"></div>
            <div className="w-2 h-2 border-2 border-green-400/50 rounded-full"></div>
          </div>
        </div>

        {/* 天候レーダーボタン */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 pointer-events-auto flex flex-col gap-2">
          <button
            onClick={() => setShowWeatherRadar(true)}
            className="bg-black/50 text-green-400 px-3 py-2 rounded hover:bg-black/70 transition-colors border border-green-400/50 text-sm font-mono"
            title="天候レーダー"
          >
            📡 WX
          </button>
          <button
            onClick={() => setShowNavigation(true)}
            className="bg-black/50 text-blue-400 px-3 py-2 rounded hover:bg-black/70 transition-colors border border-blue-400/50 text-sm font-mono"
            title="航法システム"
          >
            🧭 NAV
          </button>
        </div>
      </div>

      {/* 天候レーダーオーバーレイ */}
      <WeatherRadar
        isOpen={showWeatherRadar}
        onClose={() => setShowWeatherRadar(false)}
      />

      {/* 航法システムオーバーレイ */}
      <NavigationDisplay
        isOpen={showNavigation}
        onClose={() => setShowNavigation(false)}
      />
    </div>
  );
};
