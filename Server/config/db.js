import "dotenv/config";
import mysql from "mysql2";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the database connection
db.getConnection((error, connection) => {
  if (error) {
    console.error("Database connection failed:", error.message);
    return;
  }

  console.log("MySQL database connected successfully!");

  connection.release();
});

export default db;
