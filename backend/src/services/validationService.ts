import type { RawCsvRow, ValidationResult } from "../types/index.js";
import { getCustomersCollection } from "../config/database.js";


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates CSV rows against business rules and database constraints.
 * Performs batch email existence checks for performance optimization.
 */
export class ValidationService {
  private existingEmails: Set<string>; // Emails already in database
  private csvEmails: Set<string>; // Emails seen in current CSV (for duplicate detection)
  private initialized: boolean;

  constructor() {
    this.existingEmails = new Set();
    this.csvEmails = new Set();
    this.initialized = false;
  }

  /**
   * Preloads existing emails from database for batch validation.
   * Must be called before validateRow().
   * @param emailsToCheck - All emails from CSV to check against database
   */
  async initialize(emailsToCheck: string[]): Promise<void> {
    if (emailsToCheck.length === 0) {
      this.existingEmails = new Set();
      return;
    }

    // Normalize and deduplicate emails
    const normalizedEmails = Array.from(
      new Set(emailsToCheck.map((e) => e.trim().toLowerCase()).filter(Boolean))
    );

    console.log(
      `Checking ${normalizedEmails.length} unique emails against database`
    );

    const collection = getCustomersCollection();
    const allExistingEmails: string[] = [];

    // Query database in chunks to avoid query size limits
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < normalizedEmails.length; i += CHUNK_SIZE) {
      const chunk = normalizedEmails.slice(i, i + CHUNK_SIZE);
      const docs = await collection
        .find({ email: { $in: chunk } })
        .project({ email: 1 })
        .toArray();

      allExistingEmails.push(...docs.map((d) => d.email.trim().toLowerCase()));
    }

    this.existingEmails = new Set(allExistingEmails);
    this.initialized = true;
    console.log(
      `Found ${this.existingEmails.size} existing emails in database`
    );
  }

  /**
   * Validates a single CSV row against business rules.
   * Checks: required fields, email format, email uniqueness (DB + CSV).
   * @param row - Raw CSV row data
   * @param rowNumber - Row number for error messages (1-indexed, includes header)
   * @returns Validation result with errors array
   */
  validateRow(row: RawCsvRow, rowNumber: number): ValidationResult {
    if (!this.initialized) throw new Error("ValidationService not initialized");

    const errors: string[] = [];
    const trimmedRow = ValidationService.trimRow(row);

    // Required field: name
    if (!trimmedRow.name) errors.push(`Row ${rowNumber}: Name is required`);

    // Required field: email (with format and uniqueness checks)
    if (!trimmedRow.email) {
      errors.push(`Row ${rowNumber}: Email is required`);
    } else {
      // Check email format
      if (!EMAIL_REGEX.test(trimmedRow.email)) {
        errors.push(`Row ${rowNumber}: Invalid email format`);
      } else {
        // Check database uniqueness
        if (this.existingEmails.has(trimmedRow.email)) {
          errors.push(`Row ${rowNumber}: Email already exists in database`);
        }
        // Check CSV uniqueness (within current file)
        if (this.csvEmails.has(trimmedRow.email)) {
          errors.push(`Row ${rowNumber}: Duplicate email within this CSV file`);
        } else {
          this.csvEmails.add(trimmedRow.email);
        }
      }
    }

    // Required field: company
    if (!trimmedRow.company)
      errors.push(`Row ${rowNumber}: Company is required`);

    // Note: phone is optional, no validation needed

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Trims whitespace from all row fields and normalizes email to lowercase.
   * @param row - Raw CSV row
   * @returns Sanitized row with trimmed fields
   */
  static trimRow(row: RawCsvRow): RawCsvRow {
    return {
      name: row.name?.trim() || "",
      email: row.email?.trim().toLowerCase() || "",
      phone: row.phone?.trim() || "",
      company: row.company?.trim() || "",
    };
  }
}
