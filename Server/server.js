import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// Middleware
app.use(cors({origin: process.env.CLIENT_URL,}));
app.use(express.json());

// Authentication routes
app.use('/api/auth', authRoutes);

// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Full Authentication System API is running!",
  });
});

// health check
app.get("/api/health", (req, res) => {

    res.status(200).json({
      success: true,
      message: "Server is running!",
    });
  } 
);
// Database health check
app.get("/api/health/db", async (req, res) => {
  try {
    await db.promise().query("SELECT 1");

    res.status(200).json({
      success: true,
      database: process.env.DB_NAME,
      message: "Database connection is working!",
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
