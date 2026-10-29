import { trackEvent } from "@/lib/analytics/track";

export type CameraState =
  | "IDLE"
  | "PERMISSION_REQUEST"
  | "CAMERA_READY"
  | "FRAME_VALIDATION"
  | "READY_TO_CAPTURE"
  | "CAPTURING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

type TransitionMap = Partial<Record<CameraState, CameraState[]>>;

const VALID_TRANSITIONS: TransitionMap = {
  IDLE: ["PERMISSION_REQUEST", "FAILED"],
  PERMISSION_REQUEST: ["CAMERA_READY", "FAILED"],
  CAMERA_READY: ["FRAME_VALIDATION", "FAILED", "IDLE"],
  FRAME_VALIDATION: ["READY_TO_CAPTURE", "CAMERA_READY", "FAILED"],
  READY_TO_CAPTURE: ["CAPTURING", "FRAME_VALIDATION", "FAILED"],
  CAPTURING: ["PROCESSING", "FAILED"],
  PROCESSING: ["COMPLETED", "FAILED"],
  COMPLETED: ["IDLE"],
  FAILED: ["IDLE", "PERMISSION_REQUEST"],
};

export class CameraStateMachine {
  private currentState: CameraState = "IDLE";
  private listeners: Set<(state: CameraState) => void> = new Set();

  public getState(): CameraState {
    return this.currentState;
  }

  public transition(newState: CameraState, errorMetadata?: Record<string, any>): boolean {
    const validNextStates = VALID_TRANSITIONS[this.currentState];

    if (!validNextStates?.includes(newState)) {
      console.warn(`[CameraStateMachine] Invalid transition from ${this.currentState} to ${newState}`);
      return false;
    }

    const oldState = this.currentState;
    this.currentState = newState;

    // Log telemetry for specific transitions. Every path into FAILED lands
    // here (permission denial, hardware error, capture failure, etc.), not
    // just frame-validation failures, so the event name stays generic and
    // previousState carries the actual cause.
    if (newState === "FAILED") {
      trackEvent("camera_state_failed", { previousState: oldState, ...errorMetadata });
    }
    
    // Notify listeners
    this.listeners.forEach((listener) => listener(this.currentState));
    
    console.info(`[CameraStateMachine] Transition: ${oldState} -> ${this.currentState}`);
    return true;
  }

  public subscribe(listener: (state: CameraState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
