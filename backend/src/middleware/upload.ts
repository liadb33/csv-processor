import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "../middleware/errorHandler.js";

// ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate human-readable timestamp: YYYYMMDDHHmmss
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(0, 14); // 20260110114305

    // Generate random number for uniqueness
    const random = Math.round(Math.random() * 1e9); // 830293601

    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);

    // Result: sample_customers-20260110114305-830293601.csv
    cb(null, `${basename}-${timestamp}-${random}${ext}`);
  },
});

// accept only CSV files
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (
    file.mimetype == "text/csv" ||
    path.extname(file.originalname).toLowerCase() == ".csv"
  ) {
    cb(null, true);
  } else {
    cb(new AppError("Only CSV files are allowed", 400));
  }
};

// create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
