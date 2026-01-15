import { ObjectId } from "mongodb";
import { getFailedRowsCollection } from "../config/database.js";
import type { FailedRow, FailedRowDocument } from "../types/database.js";
import { mapFailedRowToApi } from "../types/database.js";

export class FailedRowRepository {
  /**
   * Create a failed row record
   */
  static async createFailedRow(data: {
    jobId: string;
    rowNumber: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    error: string;
  }): Promise<FailedRow> {
    const collection = getFailedRowsCollection();

    const doc: Omit<FailedRowDocument, "_id"> = {
      jobId: new ObjectId(data.jobId),
      rowNumber: data.rowNumber,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      error: data.error,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(doc as FailedRowDocument);
    const inserted = await collection.findOne({ _id: result.insertedId });

    if (!inserted) throw new Error("Failed to create failed row");
    return mapFailedRowToApi(inserted);
  }

  /**
   * Find all failed rows for a job
   */
  static async findAllFailedRowsForJob(jobId: string): Promise<FailedRow[]> {
    const collection = getFailedRowsCollection();
    const docs = await collection
      .find({ jobId: new ObjectId(jobId) })
      .sort({ rowNumber: 1 })
      .toArray();
    return docs.map(mapFailedRowToApi);
  }

  /**
   * Count failed rows for a job
   */
  static async countByJobId(jobId: string): Promise<number> {
    const collection = getFailedRowsCollection();
    return await collection.countDocuments({ jobId: new ObjectId(jobId) });
  }

  /**
   * Delete all failed rows for a job
   */
  static async deleteByJobId(jobId: string): Promise<void> {
    const collection = getFailedRowsCollection();
    await collection.deleteMany({ jobId: new ObjectId(jobId) });
  }
}
