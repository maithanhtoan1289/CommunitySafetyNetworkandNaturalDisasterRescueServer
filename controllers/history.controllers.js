import { pool } from "../config/connectToDB.js";
import jwt from "jsonwebtoken";

export const allNaturalDisaster = async (req, res) => {
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

    const historyNaturalDisastersQuery = `
    SELECT id, name, casualty_rate, status, created_at
    FROM history_natural_disasters
  `;

    const { rows } = await pool.query(historyNaturalDisastersQuery);

    res.status(200).json({
      status: 200,
      message: "Successfully retrieved all history natural disasters",
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

export const allProblem = async (req, res) => {
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

    const historyProblemsQuery = `
    SELECT id, name, address, status , created_at
    FROM history_problems
  `;

    const { rows } = await pool.query(historyProblemsQuery);

    res.status(200).json({
      status: 200,
      message: "Successfully retrieved all history problem",
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
