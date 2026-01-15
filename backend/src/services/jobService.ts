import { JobRepository } from "../repositories/jobRepository.js";
import type { Job } from "../types/index.js";
import { emitJobUpdate } from "../websocket/socketServer.js";
import { getJobsCollection } from "../config/database.js";

export class JobService {
  /**
   * create a new job
   */
  static async createJob(filename: string): Promise<Job> {
    // later add business logic like filename validation, duplicate checking, etc.
    return await JobRepository.createJob(filename);
  }

  /**
   * get all jobs
   */
  static async getAllJobs(): Promise<Job[]> {
    return await JobRepository.findAllJobs();
  }

  /**
   * get a single job by id
   */
  static async getJobById(jobId: string): Promise<Job | null> {
    return await JobRepository.findJobById(jobId);
  }

  /**
   * update job progress and status
   */
  static async updateJobProgress(
    jobId: string,
    data: {
      status?: "pending" | "processing" | "completed" | "failed";
      progress?: number;
      totalRows?: number;
      processedRows?: number;
      successCount?: number;
      failedCount?: number;
      errors?: string[];
      startedAt?: Date;
      completedAt?: Date;
    }
  ): Promise<Job> {
    return await JobRepository.update(jobId, data);
  }

  /**
   * mark job as processing
   */
  static async startProcessing(jobId: string): Promise<Job> {
    return await JobRepository.update(jobId, {
      status: "processing",
      startedAt: new Date(),
    });
  }

  /**
   * mark job as completed
   */
  static async completeJob(jobId: string): Promise<Job> {
    return await JobRepository.update(jobId, {
      status: "completed",
      progress: 100,
      completedAt: new Date(),
    });
  }

  /**
   * mark job as failed
   */
  static async failJob(jobId: string, error: string): Promise<Job> {
    return await JobRepository.update(jobId, {
      status: "failed",
      completedAt: new Date(),
      errors: [error],
    });
  }

  /**
   * Recover jobs that were interrupted by server crash.
   * Marks all jobs with status "processing" as "failed" and emits socket updates.
   */
  static async recoverCrashedJobs(): Promise<number> {
    const jobsCollection = getJobsCollection();

    // Find all jobs that were processing when server crashed
    const crashedJobs = await jobsCollection
      .find({ status: "processing" })
      .toArray();

    if (crashedJobs.length === 0) {
      return 0;
    }

    console.log(
      `🔄 Found ${crashedJobs.length} crashed job(s), marking as failed...`
    );

    // Update each crashed job to failed status
    for (const job of crashedJobs) {
      const jobId = job._id.toHexString();

      await JobRepository.update(jobId, {
        status: "failed",
        errors: ["Server crashed during processing"],
        completedAt: new Date(),
      });

      // Emit socket update so frontend shows failed state immediately
      emitJobUpdate({
        jobId,
        status: "failed",
        progress: job.progress,
        processedRows: job.processedRows,
        successCount: job.successCount,
        failedCount: job.failedCount,
        totalRows: job.totalRows,
        errors: ["Server crashed during processing"],
        startedAt: job.startedAt?.toISOString(),
        completedAt: new Date().toISOString(),
      });
    }

    console.log(`✅ Marked ${crashedJobs.length} crashed job(s) as failed`);
    return crashedJobs.length;
  }
}
