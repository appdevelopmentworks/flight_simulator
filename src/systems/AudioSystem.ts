/**
 * 高度なオーディオシステム
 * 環境音、ATC通信、警告音、3D空間オーディオ機能
 */

import * as THREE from 'three';
import { Aircraft, WeatherConditions } from '@/types';

export interface AudioConfig {
  masterVolume: number;
  engineVolume: number;
  environmentVolume: number;
  communicationsVolume: number;
  warningVolume: number;
  spatialAudioEnabled: boolean;
}

export interface ATCMessage {
  id: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  timestamp: number;
  isPlayed: boolean;
}

export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private spatialListener: AudioListener | null = null;
  private engineAudio: Map<string, AudioBufferSourceNode> = new Map();
  private environmentalSources: Map<string, AudioBufferSourceNode> = new Map();
  private activeSounds: Map<string, { source: AudioBufferSourceNode; gainNode: GainNode }> = new Map();
  
  // オーディオバッファ
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  
  // ATC システム
  private atcMessages: ATCMessage[] = [];
  private speechSynthesis: SpeechSynthesis | null = null;
  private atcVoice: SpeechSynthesisVoice | null = null;
  
  // 設定
  private config: AudioConfig = {
    masterVolume: 0.5,
    engineVolume: 0.4,
    environmentVolume: 0.2,
    communicationsVolume: 0.4,
    warningVolume: 0.6,
    spatialAudioEnabled: true
  };
  
  constructor() {
    this.initializeAudioContext();
    this.initializeSpeechSynthesis();
    this.generateAudioBuffers();
  }
  
  /**
   * オーディオコンテキストの初期化
   */
  private initializeAudioContext(): void {
    if (typeof window === 'undefined') return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      
      // 3D空間オーディオの設定
      if (this.config.spatialAudioEnabled) {
        this.spatialListener = this.audioContext.listener;
      }
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
    }
  }
  
  /**
   * 音声合成の初期化（ATC用）
   */
  private initializeSpeechSynthesis(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    this.speechSynthesis = window.speechSynthesis;
    
    // 利用可能な音声を取得（英語の音声を優先）
    const setVoice = () => {
      const voices = this.speechSynthesis!.getVoices();
      this.atcVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Male')
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0] || null;
    };
    
    if (this.speechSynthesis.getVoices().length === 0) {
      this.speechSynthesis.addEventListener('voiceschanged', setVoice);
    } else {
      setVoice();
    }
  }
  
  /**
   * プロシージャルオーディオバッファの生成
   */
  private generateAudioBuffers(): void {
    if (!this.audioContext) return;
    
    // 風音の生成
    this.audioBuffers.set('wind', this.generateWhiteNoise(2, 0.1));
    
    // 雨音の生成
    this.audioBuffers.set('rain', this.generateRainSound(3, 0.2));
    
    // 雷音の生成
    this.audioBuffers.set('thunder', this.generateThunderSound(5, 0.3));
    
    // 警告音の生成
    this.audioBuffers.set('stall_warning', this.generateBeepSound(0.5, 800, 0.5));
    this.audioBuffers.set('altitude_warning', this.generateBeepSound(0.3, 1000, 0.7));
    this.audioBuffers.set('terrain_warning', this.generateSirenSound(2, 0.8));
  }
  
  /**
   * ホワイトノイズ生成（風音用）
   */
  private generateWhiteNoise(duration: number, volume: number): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    
    return buffer;
  }
  
  /**
   * 雨音生成
   */
  private generateRainSound(duration: number, volume: number): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      // 高周波ノイズで雨音をシミュレート
      const noise = (Math.random() * 2 - 1);
      const filtered = noise * (0.5 + 0.5 * Math.sin(i * 0.001));
      data[i] = filtered * volume;
    }
    
    return buffer;
  }
  
  /**
   * 雷音生成
   */
  private generateThunderSound(duration: number, volume: number): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const rumble = Math.sin(t * 60) * Math.exp(-t * 0.5);
      const crack = (Math.random() * 2 - 1) * Math.exp(-t * 2);
      data[i] = (rumble * 0.7 + crack * 0.3) * volume;
    }
    
    return buffer;
  }
  
  /**
   * 警告ビープ音生成
   */
  private generateBeepSound(duration: number, frequency: number, volume: number): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3); // フェードアウト
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * volume;
    }
    
    return buffer;
  }
  
  /**
   * サイレン音生成
   */
  private generateSirenSound(duration: number, volume: number): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = 800 + 400 * Math.sin(t * 4); // 周波数変調
      data[i] = Math.sin(2 * Math.PI * frequency * t) * volume;
    }
    
    return buffer;
  }
  
  /**
   * 環境音の更新
   */
  updateEnvironmentalAudio(weather: WeatherConditions, altitude: number): void {
    if (!this.audioContext || !this.masterGainNode) return;
    
    // 風音の更新
    this.updateWindSound(weather.windSpeed, altitude);
    
    // 降水音の更新
    if (weather.precipitation === 'rain') {
      this.playEnvironmentalSound('rain', weather.cloudCover * 0.3);
    } else {
      this.stopEnvironmentalSound('rain');
    }
    
    // 雷音（嵐の場合）
    if (weather.precipitation === 'rain' && weather.windSpeed > 15) {
      if (Math.random() < 0.001) { // 0.1%の確率で雷
        this.playSound('thunder', { volume: 0.2, position: null });
      }
    }
  }
  
  /**
   * 風音の更新
   */
  private updateWindSound(windSpeed: number, altitude: number): void {
    const windIntensity = Math.min(windSpeed / 30, 1.0); // 最大30m/sで正規化
    const altitudeFactor = Math.min(altitude / 10000, 1.0); // 高度による風音の変化
    const volume = windIntensity * 0.2 * (1 + altitudeFactor * 0.5);
    
    if (windIntensity > 0.1) {
      this.playEnvironmentalSound('wind', volume);
    } else {
      this.stopEnvironmentalSound('wind');
    }
  }
  
  /**
   * 環境音の再生
   */
  private playEnvironmentalSound(soundName: string, volume: number): void {
    const currentSound = this.environmentalSources.get(soundName);
    
    if (currentSound) {
      // 既に再生中の場合は音量を更新
      const gainNode = this.activeSounds.get(soundName)?.gainNode;
      if (gainNode) {
        gainNode.gain.setValueAtTime(
          volume * this.config.environmentVolume * this.config.masterVolume,
          this.audioContext!.currentTime
        );
      }
      return;
    }
    
    const buffer = this.audioBuffers.get(soundName);
    if (!buffer || !this.audioContext) return;
    
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    gainNode.connect(this.masterGainNode!);
    
    gainNode.gain.value = volume * this.config.environmentVolume * this.config.masterVolume;
    
    source.start();
    
    this.environmentalSources.set(soundName, source);
    this.activeSounds.set(soundName, { source, gainNode });
  }
  
  /**
   * 環境音の停止
   */
  private stopEnvironmentalSound(soundName: string): void {
    const source = this.environmentalSources.get(soundName);
    if (source) {
      try {
        source.stop();
      } catch (e) {
        // 既に停止している場合のエラーを無視
      }
      source.disconnect();
      this.environmentalSources.delete(soundName);
      this.activeSounds.delete(soundName);
    }
  }
  
  /**
   * 警告音の再生
   */
  playWarningSound(warningType: 'stall' | 'altitude' | 'terrain'): void {
    const soundMap = {
      stall: 'stall_warning',
      altitude: 'altitude_warning',
      terrain: 'terrain_warning'
    };
    
    const soundName = soundMap[warningType];
    this.playSound(soundName, { 
      volume: this.config.warningVolume,
      position: null,
      loop: warningType === 'terrain' // 地形警告はループ
    });
  }
  
  /**
   * 汎用音声再生
   */
  playSound(soundName: string, options: {
    volume?: number;
    position?: THREE.Vector3 | null;
    loop?: boolean;
  } = {}): void {
    const buffer = this.audioBuffers.get(soundName);
    if (!buffer || !this.audioContext || !this.masterGainNode) return;
    
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.loop = options.loop || false;
    
    // 3D空間オーディオの設定
    if (options.position && this.config.spatialAudioEnabled) {
      const panner = this.audioContext.createPanner();
      panner.positionX.value = options.position.x;
      panner.positionY.value = options.position.y;
      panner.positionZ.value = options.position.z;
      
      source.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(this.masterGainNode);
    } else {
      source.connect(gainNode);
      gainNode.connect(this.masterGainNode);
    }
    
    gainNode.gain.value = (options.volume || 0.5) * this.config.masterVolume;
    source.start();
    
    if (!options.loop) {
      source.addEventListener('ended', () => {
        source.disconnect();
        gainNode.disconnect();
      });
    }
  }
  
  /**
   * 3D空間リスナーの更新
   */
  updateSpatialListener(position: THREE.Vector3, forward: THREE.Vector3, up: THREE.Vector3): void {
    if (!this.spatialListener || !this.config.spatialAudioEnabled) return;
    
    this.spatialListener.positionX.value = position.x;
    this.spatialListener.positionY.value = position.y;
    this.spatialListener.positionZ.value = position.z;
    
    this.spatialListener.forwardX.value = forward.x;
    this.spatialListener.forwardY.value = forward.y;
    this.spatialListener.forwardZ.value = forward.z;
    
    this.spatialListener.upX.value = up.x;
    this.spatialListener.upY.value = up.y;
    this.spatialListener.upZ.value = up.z;
  }
  
  /**
   * ATCメッセージの追加
   */
  addATCMessage(message: string, priority: ATCMessage['priority'] = 'medium'): void {
    const atcMessage: ATCMessage = {
      id: `atc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      priority,
      timestamp: Date.now(),
      isPlayed: false
    };
    
    this.atcMessages.push(atcMessage);
    this.processATCQueue();
  }
  
  /**
   * ATCメッセージキューの処理
   */
  private processATCQueue(): void {
    if (!this.speechSynthesis || !this.atcVoice) return;
    
    // 優先度でソート
    this.atcMessages.sort((a, b) => {
      const priorityOrder = { emergency: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    const nextMessage = this.atcMessages.find(msg => !msg.isPlayed);
    if (nextMessage && !this.speechSynthesis.speaking) {
      this.speakATCMessage(nextMessage);
    }
  }
  
  /**
   * ATCメッセージの音声出力
   */
  private speakATCMessage(message: ATCMessage): void {
    if (!this.speechSynthesis || !this.atcVoice) return;
    
    const utterance = new SpeechSynthesisUtterance(message.message);
    utterance.voice = this.atcVoice;
    utterance.volume = Math.min(0.3, this.config.communicationsVolume * this.config.masterVolume);
    utterance.rate = 0.9; // やや遅めの話速
    utterance.pitch = 0.8; // やや低めのピッチ
    
    utterance.onend = () => {
      message.isPlayed = true;
      // 古いメッセージを削除（最新20件を保持）
      if (this.atcMessages.length > 20) {
        this.atcMessages = this.atcMessages.slice(-20);
      }
      // 次のメッセージを処理
      setTimeout(() => this.processATCQueue(), 1000);
    };
    
    this.speechSynthesis.speak(utterance);
  }
  
  /**
   * 設定の更新
   */
  updateConfig(newConfig: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.config.masterVolume;
    }
  }
  
  /**
   * システム情報の取得
   */
  getSystemInfo() {
    return {
      isInitialized: !!this.audioContext,
      audioContextState: this.audioContext?.state,
      activeSoundsCount: this.activeSounds.size,
      atcMessagesCount: this.atcMessages.length,
      config: this.config
    };
  }
  
  /**
   * システムの破棄
   */
  dispose(): void {
    // 全ての音声を停止
    this.activeSounds.forEach(({ source }) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // エラーを無視
      }
    });
    
    this.activeSounds.clear();
    this.environmentalSources.clear();
    
    // オーディオコンテキストを閉じる
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    // 音声合成を停止
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }
}

// シングルトンインスタンス
export const audioSystem = new AudioSystem();