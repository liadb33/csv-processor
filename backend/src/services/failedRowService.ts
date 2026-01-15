import { FailedRowRepository } from "../repositories/failedRowRepository.js";
import type { FailedRow } from "../types/index.js";

export class FailedRowService {
  /**
   * record a failed row
   */
  static async recordFailedRow(data: {
    jobId: string;
    rowNumber: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    error: string;
  }): Promise<FailedRow> {
    return await FailedRowRepository.createFailedRow(data);
  }

  /**
   * get all failed rows for a job
   */
  static async getFailedRowsByJobId(jobId: string): Promise<FailedRow[]> {
    return await FailedRowRepository.findAllFailedRowsForJob(jobId);
  }

  /**
   * get failed rows count for a job
   */
  static async getFailedRowsCount(jobId: string): Promise<number> {
    return await FailedRowRepository.countByJobId(jobId);
  }

  /**
   * generate CSV error report content
   */
  static async generateErrorReportCSV(jobId: string): Promise<string> {
    const failedRows = await FailedRowRepository.findAllFailedRowsForJob(jobId);

    if (failedRows.length === 0) {
      throw new Error("No failed rows to generate report");
    }

    // CSV header
    const csvHeader = "rowNumber,name,email,phone,company,error\n";

    // CSV rows with proper escaping
    const csvRows = failedRows
      .map((row) => {
        return [
          row.rowNumber,
          row.name || "",
          row.email || "",
          row.phone || "",
          row.company || "",
          row.error,
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`) // Escape quotes
          .join(",");
      })
      .join("\n");

    return csvHeader + csvRows;
  }
}
