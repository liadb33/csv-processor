/**
 * Type definitions for the CSV Processing System frontend
 * These types match the backend MongoDB schema and API responses
 */

// Job status enum matching backend JobStatus
export type JobStatus = "pending" | "processing" | "completed" | "failed";

// Job interface matching the MongoDB Job model
export interface Job {
  id: string; // MongoDB ObjectId as string
  filename: string;
  status: JobStatus;
  progress: number;
  totalRows: number;
  processedRows: number;
  successCount: number;
  failedCount: number;
  errors: string[] | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

// Socket.IO job-update event payload
export interface JobUpdatePayload {
  jobId: string; // MongoDB ObjectId as string
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

// API response types
export interface UploadResponse {
  success: boolean;
  jobId: string; // MongoDB ObjectId as string
  message: string;
}

export interface JobsListResponse {
  success: boolean;
  count: number;
  jobs: Job[];
}

export interface SingleJobResponse {
  success: boolean;
  job: Job;
}

// API error response
export interface ApiError {
  success: false;
  message: string;
  statusCode?: number;
}
