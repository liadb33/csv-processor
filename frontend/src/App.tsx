/**
 * Main App component
 * Entry point for the CSV Processing System frontend
 */

import {
  CssBaseline,
  Container,
  Typography,
  Box,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { UploadForm } from "./components/UploadForm";
import { JobsList } from "./components/JobsList";
import { useJobs } from "./hooks/useJobs";

// Create default MUI theme (clean light theme)
const theme = createTheme();

function App() {
  const { jobs, isLoading, error, refetchJobs } = useJobs();

  /**
   * Handle successful upload - refetch jobs to ensure we have the latest data
   */
  const handleUploadSuccess = () => {
    refetchJobs();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Container maxWidth="md" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography variant="h3" component="h1" gutterBottom>
              CSV Processing System
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Upload CSV files and monitor processing in real-time
            </Typography>
          </Box>

          {/* Upload Form */}
          <UploadForm onUploadSuccess={handleUploadSuccess} />

          {/* Jobs List */}
          <JobsList jobs={jobs} isLoading={isLoading} error={error} />
        </Container>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
