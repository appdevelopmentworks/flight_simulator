'use client';

import { useEffect, useRef } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

export const useEngineSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const jetOscillatorRef = useRef<OscillatorNode | null>(null);
  const jetGainNodeRef = useRef<GainNode | null>(null);
  const afterburnerOscillatorRef = useRef<OscillatorNode | null>(null);
  const afterburnerGainNodeRef = useRef<GainNode | null>(null);
  const noiseGainNodeRef = useRef<GainNode | null>(null);
  const { aircraft, gameSettings } = useSimulatorStore();
  
  useEffect(() => {
    // オーディオコンテキストの初期化
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // プロペラ機用のオシレーターとゲインノードの作成
      oscillatorRef.current = audioContextRef.current.createOscillator();
      gainNodeRef.current = audioContextRef.current.createGain();
      
      // ジェット機用のオシレーターとゲインノードの作成
      jetOscillatorRef.current = audioContextRef.current.createOscillator();
      jetGainNodeRef.current = audioContextRef.current.createGain();
      
      // アフターバーナー用のオシレーターとゲインノードの作成
      afterburnerOscillatorRef.current = audioContextRef.current.createOscillator();
      afterburnerGainNodeRef.current = audioContextRef.current.createGain();
      
      // ノイズジェネレーター用のゲインノードの作成
      noiseGainNodeRef.current = audioContextRef.current.createGain();
      
      // ノードの接続
      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      jetOscillatorRef.current.connect(jetGainNodeRef.current);
      jetGainNodeRef.current.connect(audioContextRef.current.destination);
      
      afterburnerOscillatorRef.current.connect(afterburnerGainNodeRef.current);
      afterburnerGainNodeRef.current.connect(audioContextRef.current.destination);
      
      noiseGainNodeRef.current.connect(audioContextRef.current.destination);
      
      // プロペラ機の初期設定
      oscillatorRef.current.type = 'sawtooth';
      oscillatorRef.current.frequency.value = 100;
      gainNodeRef.current.gain.value = 0;
      
      // ジェット機の初期設定
      jetOscillatorRef.current.type = 'sine';
      jetOscillatorRef.current.frequency.value = 200;
      jetGainNodeRef.current.gain.value = 0;
      
      // アフターバーナーの初期設定
      afterburnerOscillatorRef.current.type = 'sawtooth';
      afterburnerOscillatorRef.current.frequency.value = 50;
      afterburnerGainNodeRef.current.gain.value = 0;
      
      // ノイズゲインの初期設定
      noiseGainNodeRef.current.gain.value = 0;
      
      // オシレーターの開始
      oscillatorRef.current.start();
      jetOscillatorRef.current.start();
      afterburnerOscillatorRef.current.start();
    }
    
    return () => {
      // クリーンアップ - 各refの現在の値をローカル変数にコピーして使用
      const oscillator = oscillatorRef.current;
      const gainNode = gainNodeRef.current;
      const jetOscillator = jetOscillatorRef.current;
      const jetGainNode = jetGainNodeRef.current;
      const afterburnerOscillator = afterburnerOscillatorRef.current;
      const afterburnerGainNode = afterburnerGainNodeRef.current;
      const noiseGainNode = noiseGainNodeRef.current;
      const audioContext = audioContextRef.current;
      
      if (oscillator) {
        try {
          oscillator.stop();
          oscillator.disconnect();
        } catch (e) {
          // オシレータがすでに停止している場合のエラーを無視
        }
      }
      if (gainNode) {
        gainNode.disconnect();
      }
      if (jetOscillator) {
        try {
          jetOscillator.stop();
          jetOscillator.disconnect();
        } catch (e) {
          // オシレータがすでに停止している場合のエラーを無視
        }
      }
      if (jetGainNode) {
        jetGainNode.disconnect();
      }
      if (afterburnerOscillator) {
        try {
          afterburnerOscillator.stop();
          afterburnerOscillator.disconnect();
        } catch (e) {
          // オシレータがすでに停止している場合のエラーを無視
        }
      }
      if (afterburnerGainNode) {
        afterburnerGainNode.disconnect();
      }
      if (noiseGainNode) {
        noiseGainNode.disconnect();
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);
  
  useEffect(() => {
    // エンジン音の更新
    if (aircraft.type === 'f16') {
      // F-16のジェットエンジン音
      if (jetOscillatorRef.current && jetGainNodeRef.current && afterburnerOscillatorRef.current && afterburnerGainNodeRef.current) {
        // ミリタリーパワーの基本周波数
        const baseFrequency = 250;
        const frequency = baseFrequency + (aircraft.throttle * 400);
        jetOscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current!.currentTime);
        
        // アフターバーナーの判定
        const isAfterburner = aircraft.throttle > 0.8;
        
        if (isAfterburner) {
          // アフターバーナー音の周波数（低音の轟音）
          const abFrequency = 60 + (aircraft.throttle - 0.8) * 200;
          afterburnerOscillatorRef.current.frequency.setValueAtTime(abFrequency, audioContextRef.current!.currentTime);
          
          // アフターバーナーの音量
          const abVolume = ((aircraft.throttle - 0.8) / 0.2) * 0.5 * (gameSettings.sound / 100);
          afterburnerGainNodeRef.current.gain.setValueAtTime(abVolume, audioContextRef.current!.currentTime);
        } else {
          afterburnerGainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
        }
        
        // 基本ジェット音の音量
        const jetVolume = aircraft.throttle * 0.4 * (gameSettings.sound / 100);
        jetGainNodeRef.current.gain.setValueAtTime(jetVolume, audioContextRef.current!.currentTime);
      }
      
      // プロペラ機の音を無効化
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
      }
    } else if (aircraft.type === 'boeing737') {
      // Boeing 737のジェットエンジン音
      if (jetOscillatorRef.current && jetGainNodeRef.current) {
        // N1%に基づく周波数の計算（より高い周波数）
        const baseFrequency = 150;
        const frequency = baseFrequency + (aircraft.engineRPM / 100) * 300;
        jetOscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current!.currentTime);
        
        // スロットルに基づく音量の計算（ジェット音は高音量）
        const volume = (aircraft.throttle * 0.4 + (aircraft.engineRPM / 100) * 0.3) * (gameSettings.sound / 100);
        jetGainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current!.currentTime);
      }
      
      // プロペラ機の音を無効化
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
      }
    } else {
      // プロペラ機（Cessna 172）のエンジン音
      if (oscillatorRef.current && gainNodeRef.current) {
        // RPMに基づく周波数の計算
        const baseFrequency = 80;
        const frequency = baseFrequency + (aircraft.engineRPM / 2700) * 200;
        oscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current!.currentTime);
        
        // スロットルに基づく音量の計算
        const volume = (aircraft.throttle * 0.3 + (aircraft.engineRPM / 2700) * 0.2) * (gameSettings.sound / 100);
        gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current!.currentTime);
      }
      
      // ジェット機の音を無効化
      if (jetGainNodeRef.current) {
        jetGainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
      }
      // アフターバーナーを無効化
      if (afterburnerGainNodeRef.current) {
        afterburnerGainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
      }
    }
  }, [aircraft.engineRPM, aircraft.throttle, aircraft.type, gameSettings.sound]);
};
