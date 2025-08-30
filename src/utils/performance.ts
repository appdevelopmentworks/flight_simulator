/**
 * パフォーマンス監視・最適化ユーティリティ
 * FPS、メモリ使用量、レンダリングパフォーマンスを監視
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderCalls: number;
  triangles: number;
  drawCalls: number;
  timestamp: number;
}

export interface PerformanceConfig {
  targetFPS: number;
  memoryWarningThreshold: number; // MB
  autoOptimize: boolean;
  logInterval: number; // ms
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private lastLogTime: number = 0;
  private maxMetricsHistory: number = 300; // 5秒分（60FPS想定）

  public config: PerformanceConfig = {
    targetFPS: 60,
    memoryWarningThreshold: 100, // MB
    autoOptimize: true,
    logInterval: 5000 // 5秒
  };

  private currentMetrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderCalls: 0,
    triangles: 0,
    drawCalls: 0,
    timestamp: Date.now()
  };

  /**
   * フレーム開始時に呼び出し
   */
  startFrame(): void {
    this.lastFrameTime = performance.now();
  }

  /**
   * フレーム終了時に呼び出し
   */
  endFrame(renderer?: any): void {
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.frameCount++;

    // FPS計算（0除算を防ぐ）
    const fps = frameTime > 0 ? 1000 / frameTime : 0;
    
    // メモリ使用量取得（WebGL context情報）
    let memoryUsage = 0;
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      memoryUsage = (window as any).performance.memory.usedJSHeapSize / (1024 * 1024); // MB
    }

    // レンダラー情報の取得
    let renderInfo = { calls: 0, triangles: 0 };
    if (renderer && renderer.info) {
      renderInfo = {
        calls: renderer.info.render.calls || 0,
        triangles: renderer.info.render.triangles || 0
      };
      // Three.jsのレンダラー統計をリセット
      if (renderer.info.reset) {
        renderer.info.reset();
      }
    }

    // メトリクス更新
    this.currentMetrics = {
      fps: Math.round(Math.min(fps, 999) * 10) / 10, // FPS上限を999に設定
      frameTime: Math.round(frameTime * 100) / 100,
      memoryUsage: Math.round(memoryUsage * 10) / 10,
      renderCalls: renderInfo.calls,
      triangles: renderInfo.triangles,
      drawCalls: renderInfo.calls,
      timestamp: currentTime
    };

    // メトリクス履歴に追加
    this.metrics.push(this.currentMetrics);
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // 定期ログ出力
    if (currentTime - this.lastLogTime > this.config.logInterval) {
      this.logPerformance();
      this.lastLogTime = currentTime;
    }

    // 自動最適化チェック
    if (this.config.autoOptimize) {
      this.checkAndOptimize();
    }
  }

  /**
   * 現在のメトリクスを取得
   */
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * 平均FPSを取得
   */
  getAverageFPS(samples: number = 60): number {
    const recentMetrics = this.metrics.slice(-samples);
    if (recentMetrics.length === 0) return 0;
    
    // 無限値やNaNを除外して計算
    const validFps = recentMetrics
      .map(m => m.fps)
      .filter(fps => isFinite(fps) && fps > 0 && fps <= 999);
    
    if (validFps.length === 0) return 0;
    
    const avgFps = validFps.reduce((sum, fps) => sum + fps, 0) / validFps.length;
    return Math.round(avgFps * 10) / 10;
  }

  /**
   * フレーム時間の統計取得
   */
  getFrameTimeStats(samples: number = 60): { min: number, max: number, avg: number, p95: number } {
    const recentMetrics = this.metrics.slice(-samples);
    if (recentMetrics.length === 0) return { min: 0, max: 0, avg: 0, p95: 0 };
    
    const frameTimes = recentMetrics.map(m => m.frameTime).sort((a, b) => a - b);
    const min = frameTimes[0];
    const max = frameTimes[frameTimes.length - 1];
    const avg = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
    const p95Index = Math.floor(frameTimes.length * 0.95);
    const p95 = frameTimes[p95Index] || max;

    return {
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      p95: Math.round(p95 * 100) / 100
    };
  }

  /**
   * パフォーマンス警告の確認
   */
  getPerformanceWarnings(): string[] {
    const warnings: string[] = [];
    const avgFps = this.getAverageFPS();
    
    if (avgFps < this.config.targetFPS * 0.8) {
      warnings.push(`Low FPS: ${avgFps} (target: ${this.config.targetFPS})`);
    }
    
    if (this.currentMetrics.memoryUsage > this.config.memoryWarningThreshold) {
      warnings.push(`High memory usage: ${this.currentMetrics.memoryUsage}MB`);
    }
    
    const frameStats = this.getFrameTimeStats();
    if (frameStats.p95 > 20) { // 20ms = 50FPS
      warnings.push(`Frame time spikes detected: 95th percentile ${frameStats.p95}ms`);
    }

    return warnings;
  }

  /**
   * パフォーマンスログの出力
   */
  private logPerformance(): void {
    if (process.env.NODE_ENV !== 'development') return;

    const avgFps = this.getAverageFPS();
    const frameStats = this.getFrameTimeStats();
    const warnings = this.getPerformanceWarnings();

    console.group('🚀 Performance Monitor');
    console.log(`Average FPS: ${avgFps} | Memory: ${this.currentMetrics.memoryUsage}MB`);
    console.log(`Frame Time - Avg: ${frameStats.avg}ms | P95: ${frameStats.p95}ms | Max: ${frameStats.max}ms`);
    console.log(`Render - Calls: ${this.currentMetrics.renderCalls} | Triangles: ${this.currentMetrics.triangles}`);
    
    if (warnings.length > 0) {
      console.warn('⚠️ Performance Warnings:', warnings);
    }
    console.groupEnd();
  }

  /**
   * 自動最適化の実行
   */
  private checkAndOptimize(): void {
    const avgFps = this.getAverageFPS();
    
    // FPSが目標を大幅に下回る場合の対策を記録
    if (avgFps < this.config.targetFPS * 0.6) {
      this.logOptimizationSuggestion();
    }
  }

  /**
   * 最適化提案をログに出力
   */
  private logOptimizationSuggestion(): void {
    console.group('💡 Performance Optimization Suggestions');
    console.log('Consider the following optimizations:');
    console.log('- Reduce shadow map resolution');
    console.log('- Lower terrain LOD levels');
    console.log('- Disable anti-aliasing');
    console.log('- Reduce particle effects');
    console.log('- Optimize physics calculation frequency');
    console.groupEnd();
  }

  /**
   * メトリクス履歴をクリア
   */
  clearHistory(): void {
    this.metrics = [];
  }

  /**
   * 設定を更新
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// シングルトンインスタンス
export const performanceMonitor = new PerformanceMonitor();

/**
 * パフォーマンス最適化のためのユーティリティ関数
 */

/**
 * デバウンス関数（頻繁な処理の最適化用）
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

/**
 * スロットル関数（定期的な処理の最適化用）
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 重い処理を複数フレームに分割
 */
export class FrameSplitter {
  private tasks: (() => boolean)[] = [];
  private processing = false;

  addTask(task: () => boolean): void {
    this.tasks.push(task);
    if (!this.processing) {
      this.process();
    }
  }

  private process(): void {
    this.processing = true;
    const startTime = performance.now();
    const maxTime = 16; // 16ms = 60FPS の予算

    while (this.tasks.length > 0 && (performance.now() - startTime) < maxTime) {
      const task = this.tasks.shift();
      if (task) {
        const completed = task();
        if (!completed) {
          this.tasks.unshift(task); // 未完了なら先頭に戻す
          break;
        }
      }
    }

    if (this.tasks.length > 0) {
      requestAnimationFrame(() => this.process());
    } else {
      this.processing = false;
    }
  }
}

export const frameSplitter = new FrameSplitter();