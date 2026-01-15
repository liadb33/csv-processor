import { Router } from "express";
import { JobController } from "../controllers/jobController.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// POST /api/jobs/upload - upload CSV file
router.post("/upload", upload.single("file"), JobController.uploadCSV);

// GET /api/jobs - get all jobs
router.get("/", JobController.getAllJobs);

// GET /api/jobs/:id - get single job
router.get("/:id", JobController.getJobById);

// GET /api/jobs/:id/error-report - download error report
router.get("/:id/error-report", JobController.downloadErrorReport);

export default router;
