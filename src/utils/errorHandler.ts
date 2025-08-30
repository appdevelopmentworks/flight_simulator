/**
 * エラーハンドリングユーティリティ
 * 開発環境ではコンソールにエラーを表示し、本番環境では適切な処理を行う
 */

import { AircraftType } from '@/types';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface FlightSimulatorError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  timestamp: number;
}

class ErrorHandler {
  private errors: FlightSimulatorError[] = [];
  private maxErrors = 100; // メモリリークを防ぐため

  /**
   * エラーを記録し処理する
   */
  logError(
    code: string,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>
  ): void {
    const error: FlightSimulatorError = {
      code,
      message,
      severity,
      context,
      timestamp: Date.now()
    };

    // エラー配列に追加（最大数を超えた場合は古いエラーを削除）
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // 開発環境では常にコンソールに表示
    if (process.env.NODE_ENV === 'development') {
      const contextStr = context ? ` Context: ${JSON.stringify(context)}` : '';
      console.warn(`[${severity.toUpperCase()}] ${code}: ${message}${contextStr}`);
    }

    // 本番環境では重要なエラーのみ表示
    if (process.env.NODE_ENV === 'production' && 
        (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL)) {
      console.error(`Flight Simulator Error: ${message}`);
    }

    // クリティカルエラーの場合は追加処理
    if (severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(error);
    }
  }

  /**
   * クリティカルエラーの処理
   */
  private handleCriticalError(error: FlightSimulatorError): void {
    // 将来的にはエラーレポートの送信など
    // 現在はコンソールに詳細情報を表示
    console.error('Critical error occurred:', error);
  }

  /**
   * 最近のエラーを取得
   */
  getRecentErrors(count = 10): FlightSimulatorError[] {
    return this.errors.slice(-count);
  }

  /**
   * エラー履歴をクリア
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * 特定の重要度以上のエラー数を取得
   */
  getErrorCount(minSeverity: ErrorSeverity = ErrorSeverity.MEDIUM): number {
    const severityLevels = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 1,
      [ErrorSeverity.HIGH]: 2,
      [ErrorSeverity.CRITICAL]: 3
    };

    const minLevel = severityLevels[minSeverity];
    return this.errors.filter(error => severityLevels[error.severity] >= minLevel).length;
  }
}

// シングルトンインスタンス
export const errorHandler = new ErrorHandler();

// 便利な関数エクスポート
export const logLowError = (code: string, message: string, context?: Record<string, any>) => 
  errorHandler.logError(code, message, ErrorSeverity.LOW, context);

export const logMediumError = (code: string, message: string, context?: Record<string, any>) => 
  errorHandler.logError(code, message, ErrorSeverity.MEDIUM, context);

export const logHighError = (code: string, message: string, context?: Record<string, any>) => 
  errorHandler.logError(code, message, ErrorSeverity.HIGH, context);

export const logCriticalError = (code: string, message: string, context?: Record<string, any>) => 
  errorHandler.logError(code, message, ErrorSeverity.CRITICAL, context);

// エラーコード定数
export const ERROR_CODES = {
  PHYSICS_INVALID_AIRCRAFT: 'PHYSICS_001',
  PHYSICS_MISSING_SPECS: 'PHYSICS_002',
  PHYSICS_UPDATE_FAILED: 'PHYSICS_003',
  PHYSICS_STALL_CHECK_FAILED: 'PHYSICS_004',
  PHYSICS_AUTOPILOT_FAILED: 'PHYSICS_005',
  AIRCRAFT_INVALID_STATE: 'AIRCRAFT_001',
  AIRCRAFT_TYPE_UNKNOWN: 'AIRCRAFT_002'
} as const;

/**
 * 航空機タイプバリデーション関数
 */

export function isValidAircraftType(type: any): type is AircraftType {
  return typeof type === 'string' && ['cessna172', 'boeing737', 'f16'].includes(type);
}

export function validateAircraftType(type: any): AircraftType {
  if (isValidAircraftType(type)) {
    return type;
  }
  
  logHighError(
    ERROR_CODES.AIRCRAFT_TYPE_UNKNOWN,
    `Unknown aircraft type: ${type}, falling back to cessna172`,
    { providedType: type }
  );
  
  return 'cessna172'; // デフォルトにフォールバック
}