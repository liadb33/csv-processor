/**
 * Jobs List component
 * Displays all jobs with loading state and empty state handling
 */

import { Box, Typography, Skeleton, Paper } from "@mui/material";
import WorkOffIcon from "@mui/icons-material/WorkOff";
import { JobCard } from "./JobCard";
import type { Job } from "../types";

interface JobsListProps {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Loading skeleton for jobs list
 */
const JobsSkeleton = () => (
  <Box>
    {[1, 2, 3].map((index) => (
      <Paper key={index} sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton
            variant="rectangular"
            width={80}
            height={24}
            sx={{ borderRadius: 2 }}
          />
        </Box>
        <Skeleton
          variant="rectangular"
          width="100%"
          height={10}
          sx={{ borderRadius: 1, mb: 1 }}
        />
        <Skeleton variant="text" width="40%" />
      </Paper>
    ))}
  </Box>
);

/**
 * Empty state when no jobs exist
 */
const EmptyState = () => (
  <Paper
    sx={{
      p: 4,
      textAlign: "center",
      bgcolor: "grey.50",
    }}
  >
    <WorkOffIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
    <Typography variant="h6" color="text.secondary" gutterBottom>
      No jobs yet
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Upload a CSV file to create your first processing job.
    </Typography>
  </Paper>
);

export const JobsList = ({ jobs, isLoading, error }: JobsListProps) => {
  // Show loading skeletons
  if (isLoading) {
    return (
      <Box>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
          Processing Jobs
        </Typography>
        <JobsSkeleton />
      </Box>
    );
  }

  // Show error message
  if (error) {
    return (
      <Box>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
          Processing Jobs
        </Typography>
        <Paper sx={{ p: 3, bgcolor: "error.light" }}>
          <Typography color="error">Error loading jobs: {error}</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
        Processing Jobs
        {jobs.length > 0 && (
          <Typography
            component="span"
            variant="body2"
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            ({jobs.length} total)
          </Typography>
        )}
      </Typography>

      {jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <Box>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </Box>
      )}
    </Box>
  );
};
