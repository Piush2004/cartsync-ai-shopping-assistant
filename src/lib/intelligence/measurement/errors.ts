export enum MeasurementErrorCode {
  LOW_LIGHT = 'LOW_LIGHT',
  HIGH_BLUR = 'HIGH_BLUR',
  LOW_CONFIDENCE = 'LOW_CONFIDENCE',
  BODY_NOT_VISIBLE = 'BODY_NOT_VISIBLE',
  DEPTH_FAILED = 'DEPTH_FAILED',
  MODEL_TIMEOUT = 'MODEL_TIMEOUT',
  CALIBRATION_FAILED = 'CALIBRATION_FAILED',
  IMPOSSIBLE_DIMENSIONS = 'IMPOSSIBLE_DIMENSIONS',
  INVALID_INPUT = 'INVALID_INPUT'
}

export class MeasurementError extends Error {
  public code: MeasurementErrorCode;
  public details?: any;

  constructor(code: MeasurementErrorCode, message: string, details?: any) {
    super(message);
    this.name = 'MeasurementError';
    this.code = code;
    this.details = details;
  }
}
