import { pool } from "../config/connectToDB.js";

export const all = async (req, res) => {
  try {
    const usersQuery = `
      SELECT users.id, users.name, users.email, users.address, users.phone, roles.name AS role
      FROM users
      INNER JOIN user_role ON users.id = user_role.user_id
      INNER JOIN roles ON user_role.role_id = roles.id
      WHERE roles.name = 'ROLE_USER'
    `;

    const { rows } = await pool.query(usersQuery);

    res.status(200).json({
      status: 200,
      message: "Successfully retrieved all users",
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
