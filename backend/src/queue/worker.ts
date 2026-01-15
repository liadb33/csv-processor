import { Queue, Job } from "bull";
import fs from "fs/promises";
import { ObjectId, AnyBulkWriteOperation } from "mongodb";
import { getQueue } from "./bullQueue.js";
import type { JobData, JobResult } from "../types/queue.js";
import { CsvService } from "../services/csvService.js";
import { ValidationService } from "../services/validationService.js";
import { JobService } from "../services/jobService.js";
import { FailedRowService } from "../services/failedRowService.js";
import { emitJobUpdate } from "../websocket/socketServer.js";
import {
  getClient,
  getJobsCollection,
  getCustomersCollection,
  getFailedRowsCollection,
} from "../config/database.js";
import type { CustomerDocument } from "../types/database.js";

// Batch configuration
const BATCH_SIZE = 25;
const EMIT_INTERVAL = 100;

interface ValidatedRow {
  rowNumber: number;
  rowIndex: number;
  sanitizedRow: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
}

export class Worker {
  private queue: Queue<JobData>;

  constructor() {
    this.queue = getQueue();
  }

  start(): void {
    console.log("🔄 Worker started, listening to Bull queue...");
    this.queue.process(1, async (job: Job<JobData>) => {
      return await this.processJob(job);
    });
    console.log("✅ Worker registered with Bull (concurrency: 1)");
  }

  async stop(): Promise<void> {
    console.log("🛑 Worker stopping...");
  }

  private async processJob(job: Job<JobData>): Promise<JobResult> {
    const { jobId, filepath } = job.data;

    console.log("");
    console.log("=".repeat(50));
    console.log(
      `🚀 Starting job ${jobId} (attempt ${job.attemptsMade + 1}/${
        job.opts.attempts
      })`
    );
    console.log(`📄 File: ${filepath}`);
    console.log("=".repeat(50));

    try {
      // Check if this is a retry (failed rows exist from previous attempt)
      const jobObjectId = new ObjectId(jobId);
      const existingFailedRows = await getFailedRowsCollection().countDocuments(
        {
          jobId: jobObjectId,
        }
      );

      if (existingFailedRows > 0) {
        console.log(
          `🔄 Retry detected, cleaning up ${existingFailedRows} failed row(s) from previous attempt...`
        );
        await getFailedRowsCollection().deleteMany({ jobId: jobObjectId });
      }

      await JobService.startProcessing(jobId);
      const startedAt = new Date().toISOString();
      this.emitUpdate(jobId, "processing", 0, 0, 0, 0, 0, undefined, startedAt);

      console.log(`📊 Counting rows...`);
      const totalRows = await CsvService.countRows(filepath);

      if (totalRows === 0) {
        console.log("⚠️ CSV file is empty");
        await JobService.failJob(jobId, "CSV file is empty");
        this.emitUpdate(jobId, "failed", 0, 0, 0, 0, 0);
        // await this.cleanupFile(filepath); //  keeping files for now
        return {
          jobId,
          success: false,
          successCount: 0,
          failedCount: 0,
          error: "CSV file is empty",
        };
      }

      await JobService.updateJobProgress(jobId, { totalRows });
      console.log(`📊 Total rows to process: ${totalRows}`);

      // Pre-load emails for batch validation
      console.log(`🔍 Pre-loading emails for batch validation...`);
      const emails: string[] = [];
      await CsvService.processFileStream(filepath, async (row) => {
        if (row.email) emails.push(row.email);
      });

      const validator = new ValidationService();
      await validator.initialize(emails);
      console.log(`✅ Validation initialized with ${emails.length} emails`);

      let successCount = 0;
      let failedCount = 0;
      const allErrors: string[] = [];
      let lastEmittedRow = 0;
      let currentBatch: ValidatedRow[] = [];

      console.log(
        `\n🔄 Starting batch processing (batch size: ${BATCH_SIZE})...`
      );

      await CsvService.processFileStream(filepath, async (row, rowIndex) => {
        const rowNumber = rowIndex + 2;
        const sanitizedRow = ValidationService.trimRow(row);
        const validationResult = validator.validateRow(sanitizedRow, rowNumber);

        if (validationResult.isValid) {
          // Add to batch for bulk insert
          currentBatch.push({ rowNumber, rowIndex, sanitizedRow });

          // Process batch when full or last row
          if (currentBatch.length >= BATCH_SIZE || rowIndex + 1 === totalRows) {
            const batchResult = await this.processBatch(
              currentBatch,
              jobId,
              totalRows,
              successCount,
              failedCount,
              allErrors
            );

            successCount = batchResult.successCount;
            failedCount = batchResult.failedCount;
            currentBatch = [];
          }
        } else {
          // Validation failed - process immediately
          const errorMsg = validationResult.errors.join(", ");
          allErrors.push(...validationResult.errors);
          failedCount++;

          await FailedRowService.recordFailedRow({
            jobId,
            rowNumber,
            name: row.name || null,
            email: row.email || null,
            phone: row.phone || null,
            company: row.company || null,
            error: errorMsg,
          });

          await JobService.updateJobProgress(jobId, {
            processedRows: rowIndex + 1,
            successCount,
            failedCount,
            progress: Math.round(((rowIndex + 1) / totalRows) * 100),
            errors: allErrors.slice(0, 100),
          });
        }

        // Throttled Socket.IO updates
        const rowsSinceLastEmit = rowIndex + 1 - lastEmittedRow;
        if (rowsSinceLastEmit >= EMIT_INTERVAL || rowIndex + 1 === totalRows) {
          this.emitUpdate(
            jobId,
            "processing",
            Math.round(((rowIndex + 1) / totalRows) * 100),
            rowIndex + 1,
            successCount,
            failedCount,
            totalRows
          );
          lastEmittedRow = rowIndex + 1;
          console.log(
            `📊 Progress: ${Math.round(((rowIndex + 1) / totalRows) * 100)}% ` +
              `(${
                rowIndex + 1
              }/${totalRows}) - ✅ ${successCount} ❌ ${failedCount}`
          );
        }
      });

      await JobService.completeJob(jobId);

      // Small delay to ensure the last "processing" event is received before "completed"
      await new Promise((resolve) => setTimeout(resolve, 100));

      this.emitUpdate(
        jobId,
        "completed",
        100,
        totalRows,
        successCount,
        failedCount,
        totalRows,
        allErrors.slice(0, 100),
        undefined, // startedAt already set
        new Date().toISOString() // completedAt
      );
      // await this.cleanupFile(filepath); // Commented out - keeping files for now

      console.log("");
      console.log("=".repeat(50));
      console.log(`✅ Job ${jobId} completed`);
      console.log(`📊 Results: ${successCount} success, ${failedCount} failed`);
      console.log("=".repeat(50));

      return { jobId, success: true, successCount, failedCount };
    } catch (error) {
      console.error(
        `❌ Job ${jobId} failed (attempt ${job.attemptsMade + 1}):`,
        error
      );
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await JobService.failJob(jobId, errorMessage);
      this.emitUpdate(jobId, "failed", 0, 0, 0, 0, 0);

      const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 1);
      if (isFinalAttempt) {
        // await this.cleanupFile(filepath); // Commented out - keeping files for now
        console.log(`🗑️  Final attempt failed, file kept (cleanup disabled)`);
      } else {
        console.log(
          `🔄 File kept for retry (attempt ${job.attemptsMade + 1}/${
            job.opts.attempts
          })`
        );
      }

      throw error;
    }
  }

  /**
   * Process a batch of valid rows using bulkWrite with transaction
   * If batch fails, fallback to row-by-row to identify which row failed
   */
  private async processBatch(
    batch: ValidatedRow[],
    jobId: string,
    totalRows: number,
    currentSuccessCount: number,
    currentFailedCount: number,
    allErrors: string[]
  ): Promise<{ successCount: number; failedCount: number }> {
    if (batch.length === 0) {
      return {
        successCount: currentSuccessCount,
        failedCount: currentFailedCount,
      };
    }

    const client = getClient();
    const session = client.startSession();
    const jobObjectId = new ObjectId(jobId);
    const lastRowIndex = batch[batch.length - 1].rowIndex;

    try {
      await session.withTransaction(async () => {
        const customersCollection = getCustomersCollection();
        const jobsCollection = getJobsCollection();

        // Prepare bulk insert operations
        const bulkOps: AnyBulkWriteOperation<CustomerDocument>[] = batch.map(
          ({ sanitizedRow }) => ({
            insertOne: {
              document: {
                _id: new ObjectId(),
                name: sanitizedRow.name,
                email: sanitizedRow.email,
                phone: sanitizedRow.phone || null,
                company: sanitizedRow.company,
                jobId: jobObjectId,
                createdAt: new Date(),
              },
            },
          })
        );

        // Bulk insert all customers in batch
        await customersCollection.bulkWrite(bulkOps, {
          session,
          ordered: true,
        });

        // Update job progress (once per batch)
        await jobsCollection.updateOne(
          { _id: jobObjectId },
          {
            $set: {
              processedRows: lastRowIndex + 1,
              successCount: currentSuccessCount + batch.length,
              failedCount: currentFailedCount,
              progress: Math.round(((lastRowIndex + 1) / totalRows) * 100),
              errors: allErrors.slice(0, 100),
            },
          },
          { session }
        );
      });

      // Batch succeeded
      return {
        successCount: currentSuccessCount + batch.length,
        failedCount: currentFailedCount,
      };
    } catch (batchError) {
      // Batch failed - fallback to row-by-row processing
      console.warn(
        `⚠️ Batch failed, falling back to row-by-row processing for ${batch.length} rows`
      );

      let successCount = currentSuccessCount;
      let failedCount = currentFailedCount;

      for (const { rowNumber, rowIndex, sanitizedRow } of batch) {
        const rowSession = client.startSession();
        try {
          await rowSession.withTransaction(async () => {
            const customersCollection = getCustomersCollection();
            const jobsCollection = getJobsCollection();

            await customersCollection.insertOne(
              {
                _id: new ObjectId(),
                name: sanitizedRow.name,
                email: sanitizedRow.email,
                phone: sanitizedRow.phone || null,
                company: sanitizedRow.company,
                jobId: jobObjectId,
                createdAt: new Date(),
              },
              { session: rowSession }
            );

            await jobsCollection.updateOne(
              { _id: jobObjectId },
              {
                $set: {
                  processedRows: rowIndex + 1,
                  successCount: successCount + 1,
                  failedCount,
                  progress: Math.round(((rowIndex + 1) / totalRows) * 100),
                  errors: allErrors.slice(0, 100),
                },
              },
              { session: rowSession }
            );
          });

          successCount++;
        } catch (rowError) {
          const errorMsg = `Row ${rowNumber}: Database error - ${
            rowError instanceof Error ? rowError.message : "Unknown error"
          }`;
          allErrors.push(errorMsg);
          failedCount++;

          await FailedRowService.recordFailedRow({
            jobId,
            rowNumber,
            name: sanitizedRow.name,
            email: sanitizedRow.email,
            phone: sanitizedRow.phone,
            company: sanitizedRow.company,
            error: errorMsg,
          });
        } finally {
          await rowSession.endSession();
        }
      }

      return { successCount, failedCount };
    } finally {
      await session.endSession();
    }
  }

  private async cleanupFile(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath);
      console.log(`🗑️  Deleted uploaded file: ${filepath}`);
    } catch (error) {
      console.error(`⚠️  Failed to delete file ${filepath}:`, error);
    }
  }

  private emitUpdate(
    jobId: string,
    status: "pending" | "processing" | "completed" | "failed",
    progress: number,
    processedRows: number,
    successCount: number,
    failedCount: number,
    totalRows: number,
    errors?: string[],
    startedAt?: string,
    completedAt?: string
  ): void {
    emitJobUpdate({
      jobId,
      status,
      progress,
      processedRows,
      successCount,
      failedCount,
      totalRows,
      errors,
      startedAt,
      completedAt,
    });
  }
}
