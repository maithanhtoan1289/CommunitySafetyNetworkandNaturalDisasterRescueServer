import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "CSN&DRP",
  password: "123",
  port: 5432,
});

const connectToDB = async () => {
  try {
    await pool.connect();
    console.log("Connected to PostgreSQL database!");
  } catch (error) {
    console.error("Error connecting to PostgreSQL database:", error);
    throw error;
  }
};

export { pool, connectToDB };
