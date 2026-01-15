import { ObjectId } from "mongodb";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

// Internal document types (with ObjectId)
export interface JobDocument {
  _id: ObjectId;
  filename: string;
  status: JobStatus;
  progress: number;
  totalRows: number;
  processedRows: number;
  successCount: number;
  failedCount: number;
  errors: string[];
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface CustomerDocument {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  jobId: ObjectId;
  createdAt: Date;
}

export interface FailedRowDocument {
  _id: ObjectId;
  jobId: ObjectId;
  rowNumber: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  error: string;
  createdAt: Date;
}

export interface Job {
  id: string;
  filename: string;
  status: JobStatus;
  progress: number;
  totalRows: number;
  processedRows: number;
  successCount: number;
  failedCount: number;
  errors: string[];
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  jobId: string;
  createdAt: Date;
}

export interface FailedRow {
  id: string;
  jobId: string;
  rowNumber: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  error: string;
  createdAt: Date;
}

/**
 * Converts JobDocument (MongoDB) to Job (API) by transforming ObjectId to string.
 */
export function mapJobToApi(doc: JobDocument): Job {
  return {
    id: doc._id.toHexString(),
    filename: doc.filename,
    status: doc.status,
    progress: doc.progress,
    totalRows: doc.totalRows,
    processedRows: doc.processedRows,
    successCount: doc.successCount,
    failedCount: doc.failedCount,
    errors: doc.errors,
    createdAt: doc.createdAt,
    startedAt: doc.startedAt,
    completedAt: doc.completedAt,
  };
}

/**
 * Converts CustomerDocument (MongoDB) to Customer (API) by transforming ObjectIds to strings.
 */
export function mapCustomerToApi(doc: CustomerDocument): Customer {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    company: doc.company,
    jobId: doc.jobId.toHexString(),
    createdAt: doc.createdAt,
  };
}

/**
 * Converts FailedRowDocument (MongoDB) to FailedRow (API) by transforming ObjectIds to strings.
 */
export function mapFailedRowToApi(doc: FailedRowDocument): FailedRow {
  return {
    id: doc._id.toHexString(),
    jobId: doc.jobId.toHexString(),
    rowNumber: doc.rowNumber,
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    company: doc.company,
    error: doc.error,
    createdAt: doc.createdAt,
  };
}
