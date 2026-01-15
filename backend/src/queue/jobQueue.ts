interface QueuedJob {
  jobId: number;
  filepath: string;
}

// in memory queue simple array for now
const jobQueue: QueuedJob[] = [];

/**
 * add a job to the queue
 */
export const addJobToQueue = (jobId: number, filepath: string) => {
  jobQueue.push({ jobId, filepath });
  console.log(`Job ${jobId} added to queue. Queue length: ${jobQueue.length}`);
};

/**
 * get the next job from the queue (FIFO)
 */
export const getNextJob = (): QueuedJob | undefined => {
  return jobQueue.shift();
};

/**
 * check if queue has jobs
 */
export const hasJobs = (): boolean => {
  return jobQueue.length > 0;
};


/**
 * Get current queue length
 */
export const getQueueLength = (): number => {
  return jobQueue.length;
};

