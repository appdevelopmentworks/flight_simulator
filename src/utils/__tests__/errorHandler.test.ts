import {
  errorHandler,
  ErrorSeverity,
  logLowError,
  logMediumError,
  logHighError,
  logCriticalError,
  isValidAircraftType,
  validateAircraftType,
  ERROR_CODES
} from '../errorHandler';

describe('ErrorHandler', () => {
  beforeEach(() => {
    // 各テスト前にエラー履歴をクリア
    errorHandler.clearErrors();
    // コンソールをモック
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // モックをリストア
    jest.restoreAllMocks();
  });

  describe('errorHandler basic functionality', () => {
    it('should log and store errors', () => {
      errorHandler.logError('TEST_001', 'Test error message', ErrorSeverity.MEDIUM);
      
      const errors = errorHandler.getRecentErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('TEST_001');
      expect(errors[0].message).toBe('Test error message');
      expect(errors[0].severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should include context in error logs', () => {
      const context = { userId: '123', action: 'test' };
      errorHandler.logError('TEST_002', 'Test with context', ErrorSeverity.LOW, context);
      
      const errors = errorHandler.getRecentErrors();
      expect(errors[0].context).toEqual(context);
    });

    it('should limit stored errors to maximum count', () => {
      // 105個のエラーを追加（maxErrorsは100）
      for (let i = 0; i < 105; i++) {
        errorHandler.logError(`TEST_${i}`, `Error ${i}`, ErrorSeverity.LOW);
      }
      
      const errors = errorHandler.getRecentErrors(200); // 全部取得を試行
      expect(errors.length).toBeLessThanOrEqual(100);
      
      // 最新のエラーが残っていることを確認
      expect(errors[errors.length - 1].code).toBe('TEST_104');
    });

    it('should get correct error count by severity', () => {
      errorHandler.logError('LOW_1', 'Low error', ErrorSeverity.LOW);
      errorHandler.logError('MEDIUM_1', 'Medium error', ErrorSeverity.MEDIUM);
      errorHandler.logError('HIGH_1', 'High error', ErrorSeverity.HIGH);
      errorHandler.logError('CRITICAL_1', 'Critical error', ErrorSeverity.CRITICAL);
      
      expect(errorHandler.getErrorCount(ErrorSeverity.LOW)).toBe(4);
      expect(errorHandler.getErrorCount(ErrorSeverity.MEDIUM)).toBe(3);
      expect(errorHandler.getErrorCount(ErrorSeverity.HIGH)).toBe(2);
      expect(errorHandler.getErrorCount(ErrorSeverity.CRITICAL)).toBe(1);
    });

    it('should clear errors correctly', () => {
      errorHandler.logError('TEST_001', 'Test error', ErrorSeverity.MEDIUM);
      expect(errorHandler.getRecentErrors()).toHaveLength(1);
      
      errorHandler.clearErrors();
      expect(errorHandler.getRecentErrors()).toHaveLength(0);
    });
  });

  describe('console logging behavior', () => {
    it('should log to console in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      errorHandler.logError('DEV_001', 'Dev error', ErrorSeverity.MEDIUM, { test: true });
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[MEDIUM] DEV_001: Dev error')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Context: {"test":true}')
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should only log high/critical errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      errorHandler.logError('PROD_LOW', 'Low error', ErrorSeverity.LOW);
      errorHandler.logError('PROD_HIGH', 'High error', ErrorSeverity.HIGH);
      errorHandler.logError('PROD_CRITICAL', 'Critical error', ErrorSeverity.CRITICAL);
      
      expect(console.warn).not.toHaveBeenCalled();
      // クリティカルエラーはハンドラ内で追加のログが出る可能性があるため、少なくとも2回は呼ばれる
      expect(console.error).toHaveBeenCalledWith('Flight Simulator Error: High error');
      expect(console.error).toHaveBeenCalledWith('Flight Simulator Error: Critical error');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('convenience logging functions', () => {
    it('should log low severity errors', () => {
      logLowError('LOW_TEST', 'Low severity message', { data: 'test' });
      
      const errors = errorHandler.getRecentErrors();
      expect(errors[0].severity).toBe(ErrorSeverity.LOW);
      expect(errors[0].code).toBe('LOW_TEST');
    });

    it('should log medium severity errors', () => {
      logMediumError('MEDIUM_TEST', 'Medium severity message');
      
      const errors = errorHandler.getRecentErrors();
      expect(errors[0].severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should log high severity errors', () => {
      logHighError('HIGH_TEST', 'High severity message');
      
      const errors = errorHandler.getRecentErrors();
      expect(errors[0].severity).toBe(ErrorSeverity.HIGH);
    });

    it('should log critical severity errors', () => {
      logCriticalError('CRITICAL_TEST', 'Critical severity message');
      
      const errors = errorHandler.getRecentErrors();
      expect(errors[0].severity).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe('aircraft type validation', () => {
    it('should validate correct aircraft types', () => {
      expect(isValidAircraftType('cessna172')).toBe(true);
      expect(isValidAircraftType('boeing737')).toBe(true);
      expect(isValidAircraftType('f16')).toBe(true);
    });

    it('should reject invalid aircraft types', () => {
      expect(isValidAircraftType('invalid')).toBe(false);
      expect(isValidAircraftType('')).toBe(false);
      expect(isValidAircraftType(null)).toBe(false);
      expect(isValidAircraftType(undefined)).toBe(false);
      expect(isValidAircraftType(123)).toBe(false);
    });

    it('should validate and return valid aircraft types unchanged', () => {
      expect(validateAircraftType('cessna172')).toBe('cessna172');
      expect(validateAircraftType('boeing737')).toBe('boeing737');
      expect(validateAircraftType('f16')).toBe('f16');
    });

    it('should fallback to cessna172 for invalid types and log error', () => {
      const result = validateAircraftType('invalid_type');
      expect(result).toBe('cessna172');
      
      const errors = errorHandler.getRecentErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe(ERROR_CODES.AIRCRAFT_TYPE_UNKNOWN);
      expect(errors[0].severity).toBe(ErrorSeverity.HIGH);
    });
  });

  describe('error codes constants', () => {
    it('should have all required error codes defined', () => {
      expect(ERROR_CODES.PHYSICS_INVALID_AIRCRAFT).toBeDefined();
      expect(ERROR_CODES.PHYSICS_MISSING_SPECS).toBeDefined();
      expect(ERROR_CODES.PHYSICS_UPDATE_FAILED).toBeDefined();
      expect(ERROR_CODES.PHYSICS_STALL_CHECK_FAILED).toBeDefined();
      expect(ERROR_CODES.PHYSICS_AUTOPILOT_FAILED).toBeDefined();
      expect(ERROR_CODES.AIRCRAFT_INVALID_STATE).toBeDefined();
      expect(ERROR_CODES.AIRCRAFT_TYPE_UNKNOWN).toBeDefined();
    });

    it('should have unique error codes', () => {
      const codes = Object.values(ERROR_CODES);
      const uniqueCodes = [...new Set(codes)];
      expect(codes.length).toBe(uniqueCodes.length);
    });
  });
});