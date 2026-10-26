import bcrypt from "bcryptjs";
import db from "../config/db.js";

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    // 2. Validate field types
    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields must be text.",
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 3. Validate username
    if (cleanUsername.length < 2 || cleanUsername.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Username must be between 2 and 100 characters.",
      });
    }

    // 4. Validate email
    if (
      cleanEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // 5. Validate password
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 72 characters.",
      });
    }

    // 6. Check whether the email already exists
    const [existingUsers] = await db
      .promise()
      .execute("SELECT id FROM users WHERE email = ?", [cleanEmail]);

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // 7. Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 12);

    // 8. Insert the new user into MySQL
    const [result] = await db.promise().execute(
      `INSERT INTO users (username, email, password)
       VALUES (?, ?, ?)`,
      [cleanUsername, cleanEmail, hashedPassword],
    );

    // 9. Return success without exposing the password
    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      user: {
        id: result.insertId,
        username: cleanUsername,
        email: cleanEmail,
      },
    });
  } catch (error) {
    // Handle duplicate email errors
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during registration.",
    });
  }
};
