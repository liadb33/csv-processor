/**
 * Custom hook for job state management
 * Handles fetching jobs, real-time updates, and state synchronization
 */

import { useState, useEffect, useCallback } from "react";
import { getAllJobs } from "../services/api";
import { useSocket } from "./useSocket";
import type { Job, JobUpdatePayload } from "../types";

interface UseJobsReturn {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  refetchJobs: () => Promise<void>;
}

/**
 * Hook for managing job list state with real-time updates
 * Fetches initial jobs and updates them via WebSocket
 */
export const useJobs = (): UseJobsReturn => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all jobs from the API
   */
  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const response = await getAllJobs();
      // Sort by most recent first
      const sortedJobs = response.jobs.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setJobs(sortedJobs);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch jobs";
      setError(message);
      console.error("Error fetching jobs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle real-time job updates from WebSocket
   */
  const handleJobUpdate = useCallback(
    (payload: JobUpdatePayload) => {
      setJobs((prevJobs) => {
        const existingJobIndex = prevJobs.findIndex(
          (job) => job.id === payload.jobId
        );

        if (existingJobIndex >= 0) {
          // Update existing job
          const updatedJobs = [...prevJobs];
          updatedJobs[existingJobIndex] = {
            ...updatedJobs[existingJobIndex],
            status: payload.status,
            progress: payload.progress,
            processedRows: payload.processedRows,
            successCount: payload.successCount,
            failedCount: payload.failedCount,
            totalRows: payload.totalRows,
            errors: payload.errors || updatedJobs[existingJobIndex].errors,
            startedAt: payload.startedAt || updatedJobs[existingJobIndex].startedAt,
            completedAt: payload.completedAt || updatedJobs[existingJobIndex].completedAt,
          };
          return updatedJobs;
        } else {
          // New job - refetch to get complete data
          fetchJobs();
          return prevJobs;
        }
      });
    },
    [fetchJobs]
  );

  // Memoize the onConnect handler to prevent infinite re-renders
  const handleSocketConnect = useCallback(() => {
    console.log("Socket connected, refreshing jobs...");
    fetchJobs();
  }, [fetchJobs]);

  // Initialize socket connection with job update handler
  useSocket({
    onJobUpdate: handleJobUpdate,
    onConnect: handleSocketConnect,
  });

  // Initial fetch on mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    isLoading,
    error,
    refetchJobs: fetchJobs,
  };
};
