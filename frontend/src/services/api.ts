/**
 * API service for the CSV Processing System
 * Handles all HTTP requests to the backend
 */

import axios from "axios";
import type { AxiosError, AxiosInstance } from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "../constants";
import type {
  UploadResponse,
  JobsListResponse,
  SingleJobResponse,
  ApiError,
} from "../types";

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Handle API errors consistently
 */
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    const message =
      axiosError.response?.data?.message ||
      axiosError.message ||
      "An error occurred";
    throw new Error(message);
  }
  throw error;
};

/**
 * Upload a CSV file to the server
 * @param file - The CSV file to upload
 * @returns The upload response containing the job ID
 */
export const uploadCSV = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<UploadResponse>(
      API_ENDPOINTS.UPLOAD,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Fetch all jobs from the server
 * @returns The list of all jobs
 */
export const getAllJobs = async (): Promise<JobsListResponse> => {
  try {
    const response = await apiClient.get<JobsListResponse>(API_ENDPOINTS.JOBS);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Fetch a single job by ID
 * @param id - The job ID (MongoDB ObjectId as string)
 * @returns The job details
 */
export const getJobById = async (id: string): Promise<SingleJobResponse> => {
  try {
    const response = await apiClient.get<SingleJobResponse>(
      API_ENDPOINTS.JOB_BY_ID(id)
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Download the error report CSV for a job
 * Triggers a file download in the browser
 * @param id - The job ID (MongoDB ObjectId as string)
 */
export const downloadErrorReport = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.ERROR_REPORT(id), {
      responseType: "blob",
    });

    // Create download link and trigger download
    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `job-${id}-errors.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    handleApiError(error);
  }
};
