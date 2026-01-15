/**
 * Animated Progress Bar component
 * Displays job processing progress with smooth transitions
 */

import { Box, LinearProgress, Typography } from "@mui/material";

interface ProgressBarProps {
  progress: number;
  processedRows: number;
  totalRows: number;
}

export const ProgressBar = ({
  progress,
  processedRows,
  totalRows,
}: ProgressBarProps) => {
  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
        <Box sx={{ width: "100%", mr: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
              // Smooth animation for progress updates
              "& .MuiLinearProgress-bar": {
                transition: "transform 0.3s ease-out",
              },
            }}
          />
        </Box>
        <Box sx={{ minWidth: 45 }}>
          <Typography variant="body2" color="text.secondary">
            {`${Math.round(progress)}%`}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {`${processedRows.toLocaleString()} / ${totalRows.toLocaleString()} rows processed`}
      </Typography>
    </Box>
  );
};
