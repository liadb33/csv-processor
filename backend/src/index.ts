import express from "express";
import http from "http";
import cors from "cors";
import { connectToDatabase } from "./config/database.js";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.js";
import { initializeSocketIO } from "./websocket/socketServer.js";
import jobRoutes from "./routes/jobRoutes.js";
import { Worker } from "./queue/worker.js";
import { JobService } from "./services/jobService.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// connect to database before starting server
async function start() {
  try {
    await connectToDatabase();

    // recover any jobs that were interrupted by server crash
    await JobService.recoverCrashedJobs();

    const io = initializeSocketIO(server);
    const worker = new Worker();
    worker.start();

    app.use(
      cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
      })
    );
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });

    app.use("/api/jobs", jobRoutes);
    app.use(errorHandler);

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log("=================================");
      console.log("CSV Processing System - Backend");
      console.log("=================================");
      console.log(`🚀 Server: http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔌 Socket.IO: Ready`);
      console.log(`💾 Database: MongoDB`);
      console.log("=================================");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

start();
