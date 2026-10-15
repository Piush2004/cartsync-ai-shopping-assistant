export type JobType = 'MEASUREMENT' | 'AVATAR' | 'VTON' | 'LLM';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'CANCELLED';
export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface ComputeJob {
  jobId: string;
  uid: string;
  jobType: JobType;
  priority: JobPriority;
  status: JobStatus;
  payload: Record<string, any>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
  result?: any;
  error?: string | null;
  
  // Worker Lease Mechanism
  workerId?: string | null;
  heartbeatAt?: string | null;
  leaseExpiresAt?: string | null;
}
