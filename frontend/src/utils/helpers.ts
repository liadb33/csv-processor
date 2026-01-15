/**
 * Utility helper functions for the CSV Processing System
 */

import { formatDistanceToNow, format, parseISO } from "date-fns";
import type { JobStatus } from "../types";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";

/**
 * Format a date string to relative time (e.g., "2 minutes ago")
 */
export const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) return "N/A";

  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "Invalid date";
  }
};

/**
 * Format a date string to full datetime format
 */
export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return "N/A";

  try {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy h:mm a");
  } catch {
    return "Invalid date";
  }
};

/**
 * Get MUI color for a job status
 */
export const getStatusColor = (
  status: JobStatus
): "warning" | "info" | "success" | "error" => {
  return STATUS_COLORS[status];
};

/**
 * Get display label for a job status
 */
export const getStatusLabel = (status: JobStatus): string => {
  return STATUS_LABELS[status];
};

/**
 * Validate if a file is a valid CSV file
 */
export const isValidCsvFile = (file: File): boolean => {
  const validExtensions = [".csv"];
  const validMimeTypes = ["text/csv", "application/vnd.ms-excel"];

  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  const hasValidExtension = validExtensions.includes(extension);
  const hasValidMimeType =
    validMimeTypes.includes(file.type) || file.type === "";

  return hasValidExtension || hasValidMimeType;
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Calculate processing duration in human-readable format
 */
export const calculateDuration = (
  startedAt: string | null,
  completedAt: string | null
): string => {
  if (!startedAt || !completedAt) return "N/A";

  try {
    const start = parseISO(startedAt);
    const end = parseISO(completedAt);
    const durationMs = end.getTime() - start.getTime();

    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
    return `${(durationMs / 60000).toFixed(1)}m`;
  } catch {
    return "N/A";
  }
};
