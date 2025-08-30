/**
 * 航法表示システム
 * ILS、VOR、GPS、フライトプラン表示
 */

import React, { useEffect, useState, useRef } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { navigationSystem, NavigationState, ILSSignal } from '@/systems/NavigationSystem';
import { Waypoint } from '@/types';

interface NavigationDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavigationDisplay: React.FC<NavigationDisplayProps> = ({ isOpen, onClose }) => {
  const { aircraft } = useSimulatorStore();
  const [navState, setNavState] = useState<NavigationState | null>(null);
  const [selectedTab, setSelectedTab] = useState<'GPS' | 'ILS' | 'VOR' | 'PLAN'>('GPS');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 航法状態の更新
  useEffect(() => {
    if (!isOpen) return;

    const updateNavigation = () => {
      const state = navigationSystem.updateNavigation(aircraft);
      setNavState(state);
    };

    updateNavigation();
    const interval = setInterval(updateNavigation, 1000); // 1秒間隔

    return () => clearInterval(interval);
  }, [isOpen, aircraft]);

  // ILSディスプレイの描画
  useEffect(() => {
    if (!canvasRef.current || !navState || selectedTab !== 'ILS' || !navState.ils) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawILSDisplay(ctx, canvas, navState.ils);
  }, [navState, selectedTab]);

  const drawILSDisplay = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, ils: ILSSignal) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 背景をクリア
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ローカライザー（水平）
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    // 水平線
    ctx.beginPath();
    ctx.moveTo(50, centerY);
    ctx.lineTo(canvas.width - 50, centerY);
    ctx.stroke();

    // ローカライザードット
    for (let i = -2; i <= 2; i++) {
      const x = centerX + i * 20;
      ctx.beginPath();
      ctx.arc(x, centerY, 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ローカライザーニードル
    const locX = centerX + ils.localizer.deviation * 20;
    ctx.strokeStyle = ils.localizer.valid ? '#ffffff' : '#ff0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(locX, centerY - 30);
    ctx.lineTo(locX, centerY + 30);
    ctx.stroke();

    // グライドスロープ（垂直）
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    // 垂直線
    ctx.beginPath();
    ctx.moveTo(centerX, 50);
    ctx.lineTo(centerX, canvas.height - 50);
    ctx.stroke();

    // グライドスロープドット
    for (let i = -2; i <= 2; i++) {
      const y = centerY + i * 20;
      ctx.beginPath();
      ctx.arc(centerX, y, 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // グライドスロープニードル
    const gsY = centerY + ils.glideslope.deviation * 20;
    ctx.strokeStyle = ils.glideslope.valid ? '#ffffff' : '#ff0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 30, gsY);
    ctx.lineTo(centerX + 30, gsY);
    ctx.stroke();

    // 中央の航空機シンボル
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY);
    ctx.lineTo(centerX + 15, centerY);
    ctx.moveTo(centerX, centerY - 10);
    ctx.lineTo(centerX, centerY + 10);
    ctx.stroke();

    // 情報表示
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.fillText(`RWY ${ils.runway}`, 10, 20);
    ctx.fillText(`FREQ ${ils.frequency}`, 10, 35);
    ctx.fillText(`DME ${ils.distance.toFixed(1)}nm`, 10, 50);
    ctx.fillText(`DA ${ils.altitude}ft`, 10, 65);
    
    // 偏差値
    ctx.fillText(`LOC: ${ils.localizer.deviation.toFixed(1)}`, canvas.width - 100, 20);
    ctx.fillText(`GS: ${ils.glideslope.deviation.toFixed(1)}`, canvas.width - 100, 35);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-black border border-green-500 p-6 rounded-lg max-w-5xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-green-400 text-xl font-mono">航法システム</h2>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-white px-3 py-1 border border-green-500 rounded"
          >
            閉じる
          </button>
        </div>

        {/* タブ */}
        <div className="flex space-x-2 mb-4">
          {(['GPS', 'ILS', 'VOR', 'PLAN'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 font-mono text-sm border rounded ${
                selectedTab === tab
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : 'border-gray-600 text-gray-400 hover:border-green-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {navState && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側: 表示エリア */}
            <div className="space-y-4">
              {selectedTab === 'GPS' && (
                <div>
                  <h3 className="text-green-400 font-mono text-lg mb-2">GPS Navigation</h3>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-green-400">Position:</span>
                        <div className="text-white">
                          {navState.gps.fix.latitude.toFixed(5)}°N
                        </div>
                        <div className="text-white">
                          {navState.gps.fix.longitude.toFixed(5)}°E
                        </div>
                      </div>
                      <div>
                        <span className="text-green-400">GPS Status:</span>
                        <div className="text-white">
                          {navState.gps.fix.satellites} sats
                        </div>
                        <div className="text-white">
                          ±{navState.gps.fix.accuracy}m
                        </div>
                      </div>
                    </div>
                    
                    {navState.gps.activeWaypoint && (
                      <div className="mt-4 p-3 bg-blue-900/30 rounded">
                        <div className="text-blue-400 font-bold">Active Waypoint</div>
                        <div className="text-white">{navState.gps.activeWaypoint.name}</div>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-gray-400">BRG:</span>
                            <span className="text-white"> {navState.gps.course.toFixed(0)}°</span>
                          </div>
                          <div>
                            <span className="text-gray-400">DIST:</span>
                            <span className="text-white"> {navState.gps.distance.toFixed(1)}km</span>
                          </div>
                          <div>
                            <span className="text-gray-400">ETA:</span>
                            <span className="text-white"> {navState.gps.eta.toFixed(0)}min</span>
                          </div>
                        </div>
                        <div className="mt-1">
                          <span className="text-gray-400">XTK:</span>
                          <span className="text-white"> {navState.gps.crossTrackError.toFixed(2)}km</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTab === 'ILS' && (
                <div>
                  <h3 className="text-green-400 font-mono text-lg mb-2">ILS Approach</h3>
                  {navState.ils ? (
                    <div className="space-y-4">
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={200}
                        className="border border-green-500 bg-black"
                      />
                      <div className="bg-gray-900 p-4 rounded font-mono text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-green-400">Localizer</div>
                            <div className={`${navState.ils.localizer.valid ? 'text-white' : 'text-red-400'}`}>
                              Course: {navState.ils.localizer.course}°
                            </div>
                            <div className="text-white">
                              Dev: {navState.ils.localizer.deviation.toFixed(1)} dots
                            </div>
                          </div>
                          <div>
                            <div className="text-green-400">Glideslope</div>
                            <div className={`${navState.ils.glideslope.valid ? 'text-white' : 'text-red-400'}`}>
                              Angle: {navState.ils.glideslope.angle}°
                            </div>
                            <div className="text-white">
                              Dev: {navState.ils.glideslope.deviation.toFixed(1)} dots
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="text-green-400">Distance:</span>
                          <span className="text-white"> {navState.ils.distance.toFixed(1)}nm</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-900 p-4 rounded text-center text-gray-400">
                      No ILS signal available
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'VOR' && (
                <div>
                  <h3 className="text-green-400 font-mono text-lg mb-2">VOR Navigation</h3>
                  <div className="space-y-2">
                    {navState.vor.map((vor, index) => (
                      <div key={vor.id} className="bg-gray-900 p-3 rounded font-mono text-sm">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-green-400">{vor.id}</span>
                            <span className="text-white ml-2">{vor.name}</span>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            vor.valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {vor.valid ? 'VALID' : 'INVALID'}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-gray-400">FREQ:</span>
                            <span className="text-white"> {vor.frequency}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">BRG:</span>
                            <span className="text-white"> {vor.bearing.toFixed(0)}°</span>
                          </div>
                          <div>
                            <span className="text-gray-400">DIST:</span>
                            <span className="text-white"> {vor.distance.toFixed(1)}km</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTab === 'PLAN' && (
                <div>
                  <h3 className="text-green-400 font-mono text-lg mb-2">Flight Plan</h3>
                  <div className="bg-gray-900 p-4 rounded">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {navigationSystem.getFlightPlan().map((waypoint, index) => (
                        <div
                          key={waypoint.id}
                          className={`p-2 rounded font-mono text-sm ${
                            navState.gps.activeWaypoint?.id === waypoint.id
                              ? 'bg-blue-500/20 border border-blue-500'
                              : 'bg-gray-800'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span className="text-white">{index + 1}. {waypoint.name}</span>
                            <span className="text-gray-400">{waypoint.altitude}m</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {waypoint.type.toUpperCase()} • {waypoint.id}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => navigationSystem.previousWaypoint()}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        ← Prev WPT
                      </button>
                      <button
                        onClick={() => navigationSystem.nextWaypoint()}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        Next WPT →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 右側: 情報パネル */}
            <div className="space-y-4">
              <div className="bg-gray-900 p-4 rounded">
                <h3 className="text-green-400 font-mono text-lg mb-2">Compass</h3>
                <div className="font-mono text-sm space-y-1">
                  <div>
                    <span className="text-gray-400">Magnetic Heading:</span>
                    <span className="text-white ml-2">{navState.compass.magneticHeading.toFixed(0)}°</span>
                  </div>
                  <div>
                    <span className="text-gray-400">True Heading:</span>
                    <span className="text-white ml-2">{navState.compass.trueHeading.toFixed(0)}°</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Mag Var:</span>
                    <span className="text-white ml-2">{navState.compass.magneticDeclination}°</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded">
                <h3 className="text-green-400 font-mono text-lg mb-2">Navigation Mode</h3>
                <div className="space-y-2">
                  {(['GPS', 'VOR', 'ILS', 'MANUAL'] as const).map(mode => (
                    <div key={mode} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        navState.navigation.mode === mode ? 'bg-green-500' : 'bg-gray-600'
                      }`}></div>
                      <span className={`font-mono text-sm ${
                        navState.navigation.mode === mode ? 'text-green-400' : 'text-gray-400'
                      }`}>{mode}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded">
                <h3 className="text-green-400 font-mono text-lg mb-2">System Status</h3>
                <div className="font-mono text-sm space-y-1 text-gray-400">
                  <div>Navigation: <span className="text-green-400">OPERATIONAL</span></div>
                  <div>GPS: <span className="text-green-400">ACTIVE</span></div>
                  <div>ILS: <span className={navState.ils ? 'text-green-400' : 'text-gray-500'}>
                    {navState.ils ? 'TUNED' : 'STANDBY'}
                  </span></div>
                  <div>VOR: <span className="text-green-400">
                    {navState.vor.filter(v => v.valid).length}/{navState.vor.length} VALID
                  </span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};