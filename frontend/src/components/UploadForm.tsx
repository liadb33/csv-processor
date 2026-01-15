import {
  useState,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type DragEvent,
} from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
// Note: Ensure these imports match your actual file paths
import { uploadCSV } from "../services/api";
import { isValidCsvFile, formatFileSize } from "../utils/helpers";

interface UploadFormProps {
  onUploadSuccess?: (jobId: number) => void;
}

export const UploadForm = ({ onUploadSuccess }: UploadFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File | undefined) => {
    setError(null);
    setSuccess(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isValidCsvFile(file)) {
      setError("Please select a valid CSV file");
      setSelectedFile(null);
      // Important: clear the input value so the same invalid file can be tried again
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
    // The explorer window usually closes automatically after selection.
    // If it doesn't, it's an OS-level behavior, but clearing the focus can help:
    fileInputRef.current?.blur();
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;

    // Clear the file input to prevent conflicts
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const file = event.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);

      const response = await uploadCSV(selectedFile);

      setSuccess(`File uploaded successfully! Job #${response.jobId} created.`);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onUploadSuccess?.(Number(response.jobId));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload file";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClickUpload = () => {
    // Prevent the click from bubbling if already uploading
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Upload CSV File
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          onChange={handleFileChange}
          style={{ display: "none" }}
          disabled={isUploading}
        />

        <Box
          onClick={handleClickUpload}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: "2px dashed",
            borderColor:
              isDragOver || selectedFile ? "primary.main" : "grey.300",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            cursor: isUploading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease-in-out",
            bgcolor: isDragOver || selectedFile ? "primary.light" : "grey.50",
            opacity: isUploading ? 0.6 : 1,
            transform: isDragOver ? "scale(1.02)" : "scale(1)",
            "&:hover": {
              borderColor: isUploading ? "grey.300" : "primary.main",
              bgcolor: isUploading ? "grey.50" : "primary.light",
            },
          }}
        >
          {selectedFile ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <InsertDriveFileIcon color="primary" />
              <Box>
                <Typography variant="body1" color="primary">
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(selectedFile.size)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box>
              <CloudUploadIcon
                sx={{
                  fontSize: 48,
                  color: isDragOver ? "primary.main" : "grey.400",
                  mb: 1,
                }}
              />
              <Typography
                variant="body1"
                color={isDragOver ? "primary.main" : "text.secondary"}
              >
                {isDragOver
                  ? "Drop your CSV file here"
                  : "Click to select or drag and drop a CSV file"}
              </Typography>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={!selectedFile || isUploading}
          startIcon={
            isUploading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <CloudUploadIcon />
            )
          }
          sx={{ mt: 2 }}
        >
          {isUploading ? "Uploading..." : "Upload and Process"}
        </Button>
      </Box>
    </Paper>
  );
};
