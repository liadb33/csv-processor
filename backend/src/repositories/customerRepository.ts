import { ObjectId } from "mongodb";
import { getCustomersCollection } from "../config/database.js";
import type { Customer, CustomerDocument } from "../types/database.js";
import { mapCustomerToApi } from "../types/database.js";

export class CustomerRepository {
  /**
   * Create a customer record
   */
  static async createCustomer(data: {
    name: string;
    email: string;
    phone: string | null;
    company: string;
    jobId: string;
  }): Promise<Customer> {
    const collection = getCustomersCollection();

    const doc: Omit<CustomerDocument, "_id"> = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      jobId: new ObjectId(data.jobId),
      createdAt: new Date(),
    };

    const result = await collection.insertOne(doc as CustomerDocument);
    const inserted = await collection.findOne({ _id: result.insertedId });

    if (!inserted) throw new Error("Failed to create customer");
    return mapCustomerToApi(inserted);
  }

  /**
   * Find a customer by email
   */
  static async findByEmail(email: string): Promise<Customer | null> {
    const collection = getCustomersCollection();
    const doc = await collection.findOne({ email });
    return doc ? mapCustomerToApi(doc) : null;
  }

  /**
   * Find all customers for a specific job
   */
  static async findByJobId(jobId: string): Promise<Customer[]> {
    const collection = getCustomersCollection();
    const docs = await collection
      .find({ jobId: new ObjectId(jobId) })
      .sort({ createdAt: 1 })
      .toArray();
    return docs.map(mapCustomerToApi);
  }

  /**
   * Batch check if emails exist in database
   */
  static async findByEmails(emails: string[]): Promise<{ email: string }[]> {
    if (emails.length === 0) return [];

    const collection = getCustomersCollection();
    const docs = await collection
      .find({ email: { $in: emails } })
      .project({ email: 1 })
      .toArray();

    return docs.map((d) => ({ email: d.email }));
  }
}
