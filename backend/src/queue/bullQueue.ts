import Bull, { Queue } from "bull";
import type { JobData, JobResult } from "../types/queue.js";

/**
 * initialize Bull queue connected to Redis
 */
export const createJobQueue = (): Queue<JobData> => {
  const queue = new Bull<JobData>("csv-processing-queue", {
    redis: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
    },
    settings: {
      // Check for stalled jobs every 5 seconds (default is 30s)
      stalledInterval: 5000,
      // Consider a job stalled if locked for more than 10 seconds without progress
      lockDuration: 10000,
    },
    defaultJobOptions: {
      attempts: 3,
      // Remove backoff delay for immediate retry
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });

  //event listeners for monitoring
  queue.on("error", (error) => {
    console.error("❌ Queue error:", error);
  });

  queue.on("failed", (job, error) => {
    console.error(
      `❌ Job ${job?.id} failed permanently after ${job?.attemptsMade} attempts:`,
      error.message
    );
  });

  return queue;
};

let queueInstance: Queue<JobData> | null = null;

/**
 * get or create queue instance
 */
export const getQueue = (): Queue<JobData> => {
  if (!queueInstance) {
    queueInstance = createJobQueue();
  }
  return queueInstance;
};

/**
 * add a job to the queue
 */
export const addJobToQueue = async (
  jobId: string,
  filepath: string
): Promise<void> => {
  const queue = getQueue();

  await queue.add(
    { jobId, filepath },
    {
      jobId: jobId, // Already a string
    }
  );

  console.log(`📋 Job ${jobId} added to Redis queue`);
};

/**
 * close queue connection
 */
export const closeQueue = async (): Promise<void> => {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
    console.log("🔌 Queue connection closed");
  }
};
