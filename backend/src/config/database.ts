import { MongoClient, Db, Collection } from "mongodb";
import type {
  JobDocument,
  CustomerDocument,
  FailedRowDocument,
} from "../types/database.js";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  const uri =
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/csv_processor_db?replicaSet=rs0&directConnection=true";

  client = new MongoClient(uri);
  await client.connect();

  db = client.db();
  console.log("💾 MongoDB connected");

  // Create indexes
  await createIndexes();

  return db;
}

async function createIndexes(): Promise<void> {
  if (!db) throw new Error("Database not connected");

  // Unique email index
  await db
    .collection("customers")
    .createIndex({ email: 1 }, { unique: true, background: true });

  // Query indexes
  await db
    .collection("customers")
    .createIndex({ jobId: 1 }, { background: true });
  await db
    .collection("failedRows")
    .createIndex({ jobId: 1 }, { background: true });
  await db
    .collection("jobs")
    .createIndex({ createdAt: -1 }, { background: true });

  console.log("📇 MongoDB indexes created");
}

export function getDb(): Db {
  if (!db)
    throw new Error("Database not connected. Call connectToDatabase() first.");
  return db;
}

export function getClient(): MongoClient {
  if (!client)
    throw new Error("Database not connected. Call connectToDatabase() first.");
  return client;
}

// Collection helpers with types
export function getJobsCollection(): Collection<JobDocument> {
  return getDb().collection<JobDocument>("jobs");
}

export function getCustomersCollection(): Collection<CustomerDocument> {
  return getDb().collection<CustomerDocument>("customers");
}

export function getFailedRowsCollection(): Collection<FailedRowDocument> {
  return getDb().collection<FailedRowDocument>("failedRows");
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("💾 MongoDB connection closed");
  }
}
