import { Server as httpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { JobUpdatePayload } from "../types/index.js";

let io: SocketIOServer;

// initialize socket.io server
export const initializeSocketIO = (server: httpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", `${socket.id}`);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", `${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

export const emitJobUpdate = (payload: JobUpdatePayload): void => {
    try{
        const io = getIO();
        io.emit("job-update", payload);
        console.log(
            `Emitted job-update for job ${payload.jobId}: ${payload.status} - ${payload.progress}%`
        );
    }catch(error){
      console.error("Failed to emit job update:", error);
      // Job continues processing even if emit fails
      // Frontend can poll /api/jobs/:id as fallback
    }
};
