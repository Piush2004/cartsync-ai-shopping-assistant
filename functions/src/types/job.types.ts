export type JobType = 'LLM' | 'VTON' | 'SMPL' | 'MEDIAPIPE';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface ComputeJob {
  jobId: string;
  uid: string;
  type: JobType;
  priority: JobPriority;
  payload: Record<string, any>;
  status: JobStatus;
  result?: any;
  error?: string | null;
  retryCount: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface VtonJob extends ComputeJob {
  type: 'VTON';
  payload: {
    userImageUrl: string;
    garmentImageUrl: string;
  };
  result?: {
    outputUrl: string;
  };
  expiresAt: string; // Timestamp corresponding to 30-day retention
}
