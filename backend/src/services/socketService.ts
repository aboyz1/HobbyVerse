import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { query } from "../config/database";
import {
  addUserToOnlineSet,
  removeUserFromOnlineSet,
  addUserToTypingSet,
  removeUserFromTypingSet,
  getTypingUsers,
} from "./cacheService";

// Export the io instance
export let io: SocketIOServer | null = null;

interface AuthenticatedSocket extends SocketIOServer {
  userId?: string;
  user?: any;
  squadRooms?: Set<string>;
}

export const initializeSocketHandlers = (socketIO: SocketIOServer): void => {
  // Store the io instance
  io = socketIO;

  // Authentication middleware for Socket.IO
  io.use(async (socket: any, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret"
      );

      // Verify user exists
      const userResult = await query(
        "SELECT id, display_name, avatar_url FROM users WHERE id = $1",
        [decoded.id]
      );
      if (userResult.rows.length === 0) {
        return next(new Error("User not found"));
      }

      socket.userId = decoded.id;
      socket.user = userResult.rows[0];
      socket.squadRooms = new Set();
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: any) => {
    console.log(`User ${socket.userId} connected`);

    // Join squad rooms
    socket.on("join_squad", async (squadId: string) => {
      try {
        // Verify user is member of the squad
        const memberResult = await query(
          "SELECT id FROM squad_members WHERE user_id = $1 AND squad_id = $2",
          [socket.userId, squadId]
        );

        if (memberResult.rows.length > 0) {
          socket.join(`squad_${squadId}`);
          socket.squadRooms.add(squadId);

          // Add user to online set in Redis
          await addUserToOnlineSet(squadId, socket.userId);

          socket.emit("joined_squad", { squadId });

          // Notify other members that user is online
          if (io) {
            socket.to(`squad_${squadId}`).emit("user_online", {
              userId: socket.userId,
              user: socket.user,
            });
          }

          // Send current typing users
          const typingUsers = await getTypingUsers(squadId);
          socket.emit("current_typing_users", { typingUsers });
        } else {
          socket.emit("error", { message: "Not a member of this squad" });
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to join squad" });
      }
    });

    // Leave squad room
    socket.on("leave_squad", async (squadId: string) => {
      socket.leave(`squad_${squadId}`);
      socket.squadRooms.delete(squadId);

      // Remove user from online set in Redis
      await removeUserFromOnlineSet(squadId, socket.userId);

      socket.emit("left_squad", { squadId });

      // Notify other members that user is offline
      if (io) {
        socket.to(`squad_${squadId}`).emit("user_offline", {
          userId: socket.userId,
        });
      }
    });

    // Send chat message
    socket.on(
      "send_message",
      async (data: {
        squadId: string;
        message: string;
        messageType?: string;
        attachments?: string[];
      }) => {
        try {
          const {
            squadId,
            message,
            messageType = "text",
            attachments = [],
          } = data;

          // Verify user is member of the squad
          const memberResult = await query(
            "SELECT id FROM squad_members WHERE user_id = $1 AND squad_id = $2",
            [socket.userId, squadId]
          );

          if (memberResult.rows.length === 0) {
            socket.emit("error", { message: "Not a member of this squad" });
            return;
          }

          // Insert message into database
          const messageResult = await query(
            `INSERT INTO chat_messages (squad_id, user_id, message, message_type, attachments) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id, created_at`,
            [squadId, socket.userId, message, messageType, attachments]
          );

          const messageData = {
            id: messageResult.rows[0].id,
            squadId,
            userId: socket.userId,
            user: socket.user,
            message,
            messageType,
            attachments,
            createdAt: messageResult.rows[0].created_at,
          };

          // Broadcast to squad room
          if (io) {
            io.to(`squad_${squadId}`).emit("new_message", messageData);
          }

          // Update last active timestamp
          await query(
            "UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1",
            [socket.userId]
          );
        } catch (error) {
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // Handle typing indicator
    socket.on("typing_start", async (squadId: string) => {
      // Add user to typing set in Redis
      await addUserToTypingSet(squadId, socket.userId);

      if (io) {
        socket.to(`squad_${squadId}`).emit("user_typing", {
          userId: socket.userId,
          user: socket.user,
        });
      }
    });

    socket.on("typing_stop", async (squadId: string) => {
      // Remove user from typing set in Redis
      await removeUserFromTypingSet(squadId, socket.userId);

      if (io) {
        socket.to(`squad_${squadId}`).emit("user_stopped_typing", {
          userId: socket.userId,
          user: socket.user,
        });
      }
    });

    // Handle real-time notifications
    socket.on("subscribe_notifications", () => {
      socket.join(`notifications_${socket.userId}`);
    });

    socket.on("unsubscribe_notifications", () => {
      socket.leave(`notifications_${socket.userId}`);
    });

    // Handle real-time updates for projects
    socket.on("subscribe_project", (projectId: string) => {
      socket.join(`project_${projectId}`);
    });

    socket.on("unsubscribe_project", (projectId: string) => {
      socket.leave(`project_${projectId}`);
    });

    // Handle real-time updates for challenges
    socket.on("subscribe_challenge", (challengeId: string) => {
      socket.join(`challenge_${challengeId}`);
    });

    socket.on("unsubscribe_challenge", (challengeId: string) => {
      socket.leave(`challenge_${challengeId}`);
    });

    // Handle live updates for user status
    socket.on("update_status", async (status: string) => {
      try {
        // Update user status in database
        await query("UPDATE users SET status = $1 WHERE id = $2", [
          status,
          socket.userId,
        ]);

        // Broadcast status update to relevant rooms
        if (io) {
          for (const squadId of socket.squadRooms) {
            socket.to(`squad_${squadId}`).emit("user_status_update", {
              userId: socket.userId,
              status,
            });
          }
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to update status" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`User ${socket.userId} disconnected`);

      // Remove user from all online sets
      if (io) {
        for (const squadId of socket.squadRooms) {
          await removeUserFromOnlineSet(squadId, socket.userId);

          // Notify squad members that user is offline
          socket.to(`squad_${squadId}`).emit("user_offline", {
            userId: socket.userId,
          });
        }
      }
    });
  });
};

// Helper functions for emitting events
export const emitNewNotification = (
  socketIO: SocketIOServer,
  userId: string,
  notification: any
) => {
  socketIO.to(`notifications_${userId}`).emit("new_notification", notification);
};

export const emitProjectUpdate = (
  socketIO: SocketIOServer,
  projectId: string,
  update: any
) => {
  socketIO.to(`project_${projectId}`).emit("project_update", update);
};

export const emitChallengeUpdate = (
  socketIO: SocketIOServer,
  challengeId: string,
  update: any
) => {
  socketIO.to(`challenge_${challengeId}`).emit("challenge_update", update);
};

export const emitSquadUpdate = (
  socketIO: SocketIOServer,
  squadId: string,
  update: any
) => {
  socketIO.to(`squad_${squadId}`).emit("squad_update", update);
};

export default {
  initializeSocketHandlers,
  emitNewNotification,
  emitProjectUpdate,
  emitChallengeUpdate,
  emitSquadUpdate,
  io, // Export the io instance
};
