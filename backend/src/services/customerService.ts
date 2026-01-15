import { CustomerRepository } from "../repositories/customerRepository.js";
import type { Customer } from "../types/index.js";

export class CustomerService {
  /**
   * create a new customer
   */
  static async createCustomer(data: {
    name: string;
    email: string;
    phone: string | null;
    company: string;
    jobId: string;
  }): Promise<Customer> {
    // Future: add business logic like normalization, duplicate checking, etc.
    return await CustomerRepository.createCustomer(data);
  }

  /**
   * check if email exists
   */
  static async emailExists(email: string): Promise<boolean> {
    const customer = await CustomerRepository.findByEmail(email);
    return customer !== null;
  }

  /**
   * get all customers for a job
   */
  static async getCustomersByJobId(jobId: string): Promise<Customer[]> {
    return await CustomerRepository.findByJobId(jobId);
  }

  /**
   * batch check emails (for validation optimization)
   */
  static async getExistingEmails(emails: string[]): Promise<Set<string>> {
    const customers = await CustomerRepository.findByEmails(emails);
    return new Set(customers.map((c) => c.email.trim().toLowerCase()));
  }
}
