import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";

// Import configurations and middleware
import { connectDatabase } from "./config/database";
import { connectRedis } from "./config/redis";
import { initializePassport } from "./config/passport";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import squadRoutes from "./routes/squads";
import projectRoutes from "./routes/projects";
import challengeRoutes from "./routes/challenges";
import notificationRoutes from "./routes/notifications";
import leaderboardRoutes from "./routes/leaderboards";
import badgeRoutes from "./routes/badges";
import feedRoutes from "./routes/feed";
import searchRoutes from "./routes/search";
import generalPostsRoutes from "./routes/generalPosts"; // Added general posts routes

// Import Socket.io handlers
import { initializeSocketHandlers } from "./services/socketService";
import { setSocketIO } from "./services/notificationService";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:19006",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:19006",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || "100"), // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing and compression
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
app.use(morgan("combined"));

// Initialize Passport
initializePassport();
app.use(require("passport").initialize());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Hobbyverse API",
    version: "1.0.0",
    documentation: "/api",
    health: "/health",
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/squads", squadRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/general-posts", generalPostsRoutes); // Added general posts routes

// Socket.io initialization
initializeSocketHandlers(io);
setSocketIO(io);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database and Redis connections
const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await connectDatabase();
    console.log("✅ Connected to PostgreSQL database");

    // Connect to Redis
    await connectRedis();
    console.log("✅ Connected to Redis cache");

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Hobbyverse API server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
  });
});

startServer();

export { app, io };
