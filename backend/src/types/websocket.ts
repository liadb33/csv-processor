import type { JobStatus } from "./database.js";

/**
 * Job update payload for Socket.IO events
 */
export interface JobUpdatePayload {
  jobId: string;
  status: JobStatus;
  progress: number;
  processedRows: number;
  successCount: number;
  failedCount: number;
  totalRows: number;
  errors?: string[];
  startedAt?: string;
  completedAt?: string;
}
