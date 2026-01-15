import { ObjectId } from "mongodb";
import { getJobsCollection } from "../config/database.js";
import type { Job, JobDocument } from "../types/database.js";
import { mapJobToApi } from "../types/database.js";

export class JobRepository {
  /**
   * Create a new job record
   */
  static async createJob(filename: string): Promise<Job> {
    const collection = getJobsCollection();

    const doc: Omit<JobDocument, "_id"> = {
      filename,
      status: "pending",
      progress: 0,
      totalRows: 0,
      processedRows: 0,
      successCount: 0,
      failedCount: 0,
      errors: [],
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
    };

    const result = await collection.insertOne(doc as JobDocument);
    const inserted = await collection.findOne({ _id: result.insertedId });

    if (!inserted) throw new Error("Failed to create job");
    return mapJobToApi(inserted);
  }

  /**
   * Find all jobs, ordered by creation date
   */
  static async findAllJobs(): Promise<Job[]> {
    const collection = getJobsCollection();
    const docs = await collection.find().sort({ createdAt: -1 }).toArray();
    return docs.map(mapJobToApi);
  }

  /**
   * Find a job by ID
   */
  static async findJobById(jobId: string): Promise<Job | null> {
    const collection = getJobsCollection();

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(jobId);
    } catch {
      return null; // Invalid ObjectId format
    }

    const doc = await collection.findOne({ _id: objectId });
    return doc ? mapJobToApi(doc) : null;
  }

  /**
   * Update job fields
   */
  static async update(
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
    const collection = getJobsCollection();
    const objectId = new ObjectId(jobId);

    await collection.updateOne({ _id: objectId }, { $set: data });

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) throw new Error(`Job ${jobId} not found after update`);
    return mapJobToApi(updated);
  }
}
