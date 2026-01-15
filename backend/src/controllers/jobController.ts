import { Request, Response } from "express";
import { JobService } from "../services/jobService.js";
import { FailedRowService } from "../services/failedRowService.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
//import { addJobToQueue } from "../queue/jobQueue.js";
import { addJobToQueue } from "../queue/bullQueue.js";
import type { UploadRequest } from "../types/index.js";

export class JobController {
  /**
   * POST /api/jobs/upload
   */
  static uploadCSV = asyncHandler(async (req: UploadRequest, res: Response) => {
    //check if file was uploaded
    if (!req.file) {
      throw new AppError("File not uploaded", 400);
    }

    // extract filename and filepath from uploaded file
    const { filename, path: filepath } = req.file;

    console.log(`File uploaded: ${filename} at ${filepath}`);

    // create job
    const job = await JobService.createJob(filename);

    console.log(`Job created with ID: ${job.id}`);

    // add job to queue
    addJobToQueue(job.id, filepath);

    console.log(`Job ${job.id} added to queue`);

    // return job ID immediately
    res.status(201).json({
      success: true,
      jobId: job.id,
      message: "File uploaded successfully. Processing started.",
    });
  });

  /**
   * Get /api/jobs
   * get all jobs
   */

  static getAllJobs = asyncHandler(async (req: Request, res: Response) => {
    const jobs = await JobService.getAllJobs();
    res.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  });

  /**
   * Get /api/jobs/:id
   * get a single job by id
   */
  static getJobById = asyncHandler(async (req: Request, res: Response) => {
    const jobId = req.params.id;

    if (!jobId || jobId.length === 0) {
      throw new AppError("Invalid job ID", 400);
    }

    // get job by id
    const job = await JobService.getJobById(jobId);

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    res.json({
      success: true,
      job,
    });
  });

  /**
   * GET /api/jobs/:id/error-report
   * Download error report as CSV
   */
  static downloadErrorReport = asyncHandler(
    async (req: Request, res: Response) => {
      const jobId = req.params.id;

      if (!jobId || jobId.length === 0) {
        throw new AppError("Invalid job ID", 400);
      }

      const job = await JobService.getJobById(jobId);

      if (!job) {
        throw new AppError("Job not found", 404);
      }

      if (job.failedCount === 0) {
        throw new AppError("No failed rows for this job", 400);
      }

      // Generate CSV content using FailedRowService
      const csvContent = await FailedRowService.generateErrorReportCSV(jobId);

      // Set headers for file download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="job-${jobId}-errors.csv"`
      );

      res.send(csvContent);
    }
  );
}
