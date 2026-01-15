/**
 * Job data structure stored in Redis queue
 */
export interface JobData {
  jobId: string;
  filepath: string;
}

/**
 * Job result after processing
 */
export interface JobResult {
  jobId: string;
  success: boolean;
  successCount: number;
  failedCount: number;
  error?: string;
}
