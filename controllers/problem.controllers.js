import { pool } from "../config/connectToDB.js";
import jwt from "jsonwebtoken";

export const all = async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        status: 401,
        message: "Access token not provided",
      });
    }

    const accessToken = token.split(" ")[1];

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const role = decoded.role;

    if (role !== "ROLE_ADMIN") {
      return res.status(403).json({
        status: 403,
        message: "Unauthorized access",
      });
    }

    const naturalDisastersQuery = `
    SELECT id, name, type, start_date, end_date, address, status 
    FROM problems
  `;

    const { rows } = await pool.query(naturalDisastersQuery);

    res.status(200).json({
      status: 200,
      message: "Successfully retrieved all problems",
      data: rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};
