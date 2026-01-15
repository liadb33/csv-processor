/**
 * CSV row structure before validation
 */
export interface RawCsvRow {
  name: string;
  email: string;
  phone: string;
  company: string;
}

/**
 * Validation result for a single row
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
