import fs from "fs";
import { parse } from "csv-parse";
import type { RawCsvRow } from "../types/index.js";

export class CsvService {
  /**
   * process CSV file row by row without loading entire file to memory
   * @param filepath - path to csv file
   * @param onRow - callback function to process each row
   * @param onProgress - callback function to track progress
   * @returns total number of rows processed
   * @throws error if required columns are missing
   */
  static async processFileStream(
    filepath: string,
    onRow: (row: RawCsvRow, rowIndex: number) => Promise<void>,
    onProgress?: (rowsProcessed: number) => void
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      let rowIndex = 0;
      let headerChecked = false;
      const requiredColumns = ["name", "email", "phone", "company"];

      const stream = fs
        .createReadStream(filepath)
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            cast: false,
          })
        )
        .on("data", async (row: RawCsvRow) => {
          // Validate headers on first row
          if (!headerChecked) {
            const actualColumns = Object.keys(row);
            const missingColumns = requiredColumns.filter(
              (col) => !actualColumns.includes(col)
            );

            if (missingColumns.length > 0) {
              const error = new Error(
                `Invalid CSV format. Missing columns: ${missingColumns.join(
                  ", "
                )}`
              );
              stream.destroy();
              reject(error);
              return;
            }

            headerChecked = true;
            console.log(
              `✅ CSV headers validated: ${actualColumns.join(", ")}`
            );
          }

          // Pause stream while processing row (backpressure)
          stream.pause();

          try {
            await onRow(row, rowIndex);
            rowIndex++;

            // Optional progress callback
            if (onProgress) {
              onProgress(rowIndex);
            }
          } catch (error) {
            stream.destroy();
            reject(error);
            return;
          }

          // Resume stream for next row
          stream.resume();
        })
        .on("end", () => {
          console.log(`✅ Processed ${rowIndex} rows from CSV`);
          resolve(rowIndex);
        })
        .on("error", (error) => {
          console.error("❌ CSV parsing error:", error);
          reject(error);
        });
    });
  }

  /**
   * parse CSV file and return rows with columm validation
   * @param filepath - path to csv file
   * @returns array of parsed rows without header
   * @throws error if required columns are missing
   */
  static async parseFile(filepath: string): Promise<RawCsvRow[]> {
    return new Promise((resolve, reject) => {
      const rows: RawCsvRow[] = [];
      let headerChecked = false;
      const requiredColumns = ["name", "email", "phone", "company"];

      const stream = fs
        .createReadStream(filepath)
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            cast: false,
          })
        )
        .on("data", (row: RawCsvRow) => {
          // validate headers on first row only
          if (!headerChecked) {
            const actualColumns = Object.keys(row);
            const missingColumns = requiredColumns.filter(
              (col) => !actualColumns.includes(col)
            );

            if (missingColumns.length > 0) {
              const error = new Error(
                `Invalid CSV format. Missing required columns: ${missingColumns.join(
                  ", "
                )}. Expected columns: ${requiredColumns.join(", ")}`
              );
              stream.destroy(error);
              reject(error);
              return;
            }

            headerChecked = true;
            console.log(`CSV headers validated: ${actualColumns.join(", ")}`);
          }

          rows.push(row);
        })
        .on("end", () => {
          console.log(`✅ Parsed ${rows.length} rows from CSV`);
          resolve(rows);
        })
        .on("error", (error) => {
          console.error("❌ CSV parsing error:", error);
          reject(error);
        });
    });
  }

  /**
   * count total rows in CSV (excluding header)
   * used to set totalRows before processing
   */
  static async countRows(filepath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let count = 0;

      fs.createReadStream(filepath)
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
          })
        )
        .on("data", () => {
          count++;
        })
        .on("end", () => {
          resolve(count);
        })
        .on("error", reject);
    });
  }
}
