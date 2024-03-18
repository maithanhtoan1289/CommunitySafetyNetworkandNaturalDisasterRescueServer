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

    const usersQuery = `
      SELECT users.id, users.name, users.email, users.address, users.phone, roles.name AS role
      FROM users
      INNER JOIN user_role ON users.id = user_role.user_id
      INNER JOIN roles ON user_role.role_id = roles.id
      WHERE roles.name = 'ROLE_EMPLOYEE'
    `;

    const { rows } = await pool.query(usersQuery);

    res.status(200).json({
      status: 200,
      message: "Successfully retrieved all employees",
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
