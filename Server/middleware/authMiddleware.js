import { createHash } from "node:crypto";
import db from "../config/db.js";

// Protect routes that require a logged-in user
export const authenticateUser = async (req, res, next) => {
  try {
    // 1. Read the token from the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token || token.length > 512) {
      return res.status(401).json({
        success: false,
        message: "Invalid session token.",
      });
    }

    // 2. Hash the token before looking it up in MySQL
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // 3. Find a valid, unexpired session
    const [sessions] = await db.promise().execute(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.role,
         u.is_email_verified
       FROM sessions AS s
       JOIN users AS u ON u.id = s.user_id
       WHERE s.session_token = ?
         AND s.expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
    );

    // 4. Reject missing or expired sessions
    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session. Please log in again.",
      });
    }

    // 5. Attach the authenticated user to the request
    req.user = sessions[0];

    // 6. Continue to the requested route
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An authentication error occurred.",
    });
  }
};

// Restrict routes to specific roles
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Authentication middleware should run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Check whether the user's role is permitted
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  };
};
