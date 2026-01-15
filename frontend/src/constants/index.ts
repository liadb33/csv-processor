/**
 * Application constants for the CSV Processing System
 */

// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

// API Endpoints
export const API_ENDPOINTS = {
  UPLOAD: "/api/jobs/upload",
  JOBS: "/api/jobs",
  JOB_BY_ID: (id: string) => `/api/jobs/${id}`,
  ERROR_REPORT: (id: string) => `/api/jobs/${id}/error-report`,
} as const;

// WebSocket Events
export const SOCKET_EVENTS = {
  JOB_UPDATE: "job-update",
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
} as const;

// Status color mapping for MUI Chip component
export const STATUS_COLORS = {
  pending: "warning",
  processing: "info",
  completed: "success",
  failed: "error",
} as const;

// Status labels for display
export const STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
} as const;

// File upload configuration
export const UPLOAD_CONFIG = {
  ACCEPTED_TYPES: [".csv", "text/csv", "application/vnd.ms-excel"],
  MAX_FILE_SIZE_MB: 10,
} as const;
