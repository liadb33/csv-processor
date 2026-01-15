/**
 * Job Card component
 * Displays individual job details with status, progress, and error list
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Divider,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { ProgressBar } from "./ProgressBar";
import { downloadErrorReport } from "../services/api";
import {
  formatRelativeTime,
  formatDateTime,
  getStatusColor,
  getStatusLabel,
  calculateDuration,
} from "../utils/helpers";
import type { Job } from "../types";

interface JobCardProps {
  job: Job;
}

export const JobCard = ({ job }: JobCardProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isProcessing = job.status === "processing";
  const isCompleted = job.status === "completed";
  const hasFailed = job.status === "failed";
  const hasErrors = job.failedCount > 0;

  /**
   * Handle error report download
   */
  const handleDownloadErrors = async () => {
    try {
      setIsDownloading(true);
      setDownloadError(null);
      await downloadErrorReport(job.id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to download error report";
      setDownloadError(message);
      console.error("Error downloading report:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        transition: "box-shadow 0.2s ease-in-out",
        "&:hover": {
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        {/* Header: Filename and Status */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <InsertDriveFileIcon color="action" />
            <Typography
              variant="h6"
              component="h3"
              sx={{ wordBreak: "break-word" }}
            >
              {job.filename}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(job.status)}
            color={getStatusColor(job.status)}
            size="small"
          />
        </Box>

        {/* Progress Bar (when processing) */}
        {isProcessing && (
          <Box sx={{ mb: 2 }}>
            <ProgressBar
              progress={job.progress}
              processedRows={job.processedRows}
              totalRows={job.totalRows}
            />
          </Box>
        )}

        {/* Success/Failure Counts (when completed or failed) */}
        {(isCompleted || hasFailed) && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">
                  {job.successCount.toLocaleString()} succeeded
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <ErrorIcon color="error" fontSize="small" />
                <Typography variant="body2">
                  {job.failedCount.toLocaleString()} failed
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Timestamps */}
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Created: {formatRelativeTime(job.createdAt)}
          </Typography>
          {job.startedAt && (
            <Typography variant="caption" color="text.secondary">
              Started: {formatDateTime(job.startedAt)}
            </Typography>
          )}
          {job.completedAt && (
            <Typography variant="caption" color="text.secondary">
              Duration: {calculateDuration(job.startedAt, job.completedAt)}
            </Typography>
          )}
        </Box>

        {/* Error List (expandable) */}
        {hasErrors && job.errors && job.errors.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography color="error">
                  {job.failedCount} Error{job.failedCount !== 1 ? "s" : ""}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box
                  sx={{
                    maxHeight: 200,
                    overflow: "auto",
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    p: 1,
                  }}
                >
                  {job.errors.slice(0, 50).map((error, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      sx={{
                        py: 0.5,
                        borderBottom: "1px solid",
                        borderColor: "grey.200",
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      {error}
                    </Typography>
                  ))}
                  {job.failedCount > 50 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      ... and {job.failedCount - 50} more errors
                    </Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Download Error Report Button - Always visible below the accordion */}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadErrors}
                disabled={isDownloading}
              >
                {isDownloading ? "Downloading..." : "Download Error Report"}
              </Button>
              {downloadError && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ display: "block", mt: 1 }}
                >
                  {downloadError}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
