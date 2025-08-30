/**
 * 天候レーダーコンポーネント
 * リアルタイム天候表示、予報、レーダー機能
 */

import React, { useEffect, useState, useRef } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { weatherSystem } from '@/systems/WeatherSystem';
import { WeatherConditions } from '@/types';

interface WeatherRadarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeatherRadar: React.FC<WeatherRadarProps> = ({ isOpen, onClose }) => {
  const { aircraft, getWeatherAtPosition, getWeatherForecast } = useSimulatorStore();
  const [currentWeather, setCurrentWeather] = useState<WeatherConditions | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [radarRange, setRadarRange] = useState(50); // km
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 天候データの更新
  useEffect(() => {
    if (!isOpen) return;

    const updateWeatherData = () => {
      const weather = getWeatherAtPosition(aircraft.position);
      setCurrentWeather(weather);
      
      const forecastData = getWeatherForecast(6); // 6時間予報
      setForecast(forecastData);
      
      const radar = weatherSystem.generateRadarData(aircraft.position, radarRange * 1000);
      setRadarData(radar);
    };

    updateWeatherData();
    const interval = setInterval(updateWeatherData, 5000); // 5秒ごと更新

    return () => clearInterval(interval);
  }, [isOpen, aircraft.position, getWeatherAtPosition, getWeatherForecast, radarRange]);

  // レーダー描画
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;

    // 背景をクリア
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // レーダー円を描画
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 十字線を描画
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, canvas.height - 20);
    ctx.moveTo(20, centerY);
    ctx.lineTo(canvas.width - 20, centerY);
    ctx.stroke();

    // 航空機位置（中央）
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // 天候データを描画
    radarData.forEach(data => {
      const distance = aircraft.position.distanceTo(data.position);
      const relativeDistance = (distance / 1000) / radarRange; // 正規化された距離
      
      if (relativeDistance <= 1) {
        const angle = Math.atan2(
          data.position.z - aircraft.position.z,
          data.position.x - aircraft.position.x
        );
        
        const x = centerX + Math.cos(angle) * maxRadius * relativeDistance;
        const y = centerY + Math.sin(angle) * maxRadius * relativeDistance;
        
        // 天候タイプに応じた色
        let color = '#00ff00';
        if (data.type === 'rain') color = '#ffff00';
        if (data.type === 'storm') color = '#ff0000';
        if (data.type === 'snow') color = '#ffffff';
        
        ctx.fillStyle = color;
        ctx.globalAlpha = data.intensity;
        ctx.beginPath();
        ctx.arc(x, y, 5 + data.intensity * 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });

    // 距離表示
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.fillText(`${radarRange}km`, 10, canvas.height - 10);
    ctx.fillText(`${radarRange / 2}km`, 10, centerY + 5);
    
  }, [radarData, aircraft.position, radarRange, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-black border border-green-500 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-green-400 text-xl font-mono">天候レーダー</h2>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-white px-3 py-1 border border-green-500 rounded"
          >
            閉じる
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* レーダー画面 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="text-green-400 font-mono">レンジ:</label>
              <select
                value={radarRange}
                onChange={(e) => setRadarRange(Number(e.target.value))}
                className="bg-black border border-green-500 text-green-400 p-1 rounded"
              >
                <option value={25}>25km</option>
                <option value={50}>50km</option>
                <option value={100}>100km</option>
                <option value={200}>200km</option>
              </select>
            </div>
            
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="border border-green-500 bg-black"
            />

            <div className="text-sm text-green-400 font-mono space-y-1">
              <div>凡例:</div>
              <div className="flex space-x-4">
                <span>⚫ 晴れ</span>
                <span className="text-yellow-400">⚫ 雨</span>
                <span className="text-red-400">⚫ 嵐</span>
                <span className="text-white">⚫ 雪</span>
              </div>
            </div>
          </div>

          {/* 現在の天候情報 */}
          <div className="space-y-4">
            <h3 className="text-green-400 font-mono text-lg">現在の天候</h3>
            {currentWeather && (
              <div className="space-y-2 text-sm font-mono">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-green-400">風向: </span>
                    <span className="text-white">{Math.round(currentWeather.windDirection)}°</span>
                  </div>
                  <div>
                    <span className="text-green-400">風速: </span>
                    <span className="text-white">{Math.round(currentWeather.windSpeed)} m/s</span>
                  </div>
                  <div>
                    <span className="text-green-400">視程: </span>
                    <span className="text-white">{Math.round(currentWeather.visibility)} km</span>
                  </div>
                  <div>
                    <span className="text-green-400">雲量: </span>
                    <span className="text-white">{Math.round(currentWeather.cloudCover * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-green-400">降水: </span>
                    <span className="text-white">{
                      currentWeather.precipitation === 'none' ? 'なし' :
                      currentWeather.precipitation === 'rain' ? '雨' :
                      currentWeather.precipitation === 'snow' ? '雪' : currentWeather.precipitation
                    }</span>
                  </div>
                  <div>
                    <span className="text-green-400">乱気流: </span>
                    <span className="text-white">{Math.round(currentWeather.turbulence * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-green-400">温度: </span>
                    <span className="text-white">{Math.round(currentWeather.temperature)}°C</span>
                  </div>
                  <div>
                    <span className="text-green-400">気圧: </span>
                    <span className="text-white">{Math.round(currentWeather.pressure)} hPa</span>
                  </div>
                </div>
              </div>
            )}

            {/* 予報 */}
            <h3 className="text-green-400 font-mono text-lg">6時間予報</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {forecast.map((item, index) => (
                <div key={index} className="border-l-2 border-green-500 pl-3 text-sm font-mono">
                  <div className="text-green-400">
                    {new Date(item.timestamp).toLocaleTimeString('ja-JP', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    <span className="text-gray-400 ml-2">
                      (信頼度: {Math.round(item.confidence * 100)}%)
                    </span>
                  </div>
                  <div className="text-white">
                    風: {Math.round(item.conditions.windDirection)}°/{Math.round(item.conditions.windSpeed)}m/s
                    , 雲: {Math.round(item.conditions.cloudCover * 100)}%
                    , 温度: {Math.round(item.conditions.temperature)}°C
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};