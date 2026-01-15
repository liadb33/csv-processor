/**
 * Custom hook for Socket.IO connection management
 * Handles connection, disconnection, and job update events
 */

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL, SOCKET_EVENTS } from "../constants";
import type { JobUpdatePayload } from "../types";

interface UseSocketOptions {
  onJobUpdate?: (payload: JobUpdatePayload) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseSocketReturn {
  isConnected: boolean;
}

/**
 * Hook for managing Socket.IO connection
 * Automatically connects on mount and disconnects on unmount
 */
export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const { onJobUpdate, onConnect, onDisconnect } = options;
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  // Use refs to store callbacks so they can be updated without reconnecting socket
  const onJobUpdateRef = useRef(onJobUpdate);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  // Keep refs updated with latest callback values
  useEffect(() => {
    onJobUpdateRef.current = onJobUpdate;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  });

  useEffect(() => {
    // Initialize socket connection only once
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const socket = socketRef.current;

    // Event handlers that use refs to access latest callbacks
    const handleConnect = () => {
      console.log("Socket connected");
      isConnectedRef.current = true;
      onConnectRef.current?.();
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      isConnectedRef.current = false;
      onDisconnectRef.current?.();
    };

    const handleJobUpdate = (payload: JobUpdatePayload) => {
      console.log("Received job update:", payload);
      onJobUpdateRef.current?.(payload);
    };

    // Set up event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(SOCKET_EVENTS.JOB_UPDATE, handleJobUpdate);

    // Cleanup on unmount only
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(SOCKET_EVENTS.JOB_UPDATE, handleJobUpdate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Empty dependency array - socket connects once on mount

  return {
    isConnected: isConnectedRef.current,
  };
};
