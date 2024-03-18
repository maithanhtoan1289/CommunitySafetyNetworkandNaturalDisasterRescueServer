import { pool } from "../config/connectToDB.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword, role } = req.body;

    const usernameExistsQuery = {
      text: "SELECT * FROM users WHERE username = $1",
      values: [username],
    };

    const { rows: usernameRows } = await pool.query(usernameExistsQuery);

    if (usernameRows.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Username already exists",
      });
    }

    const emailExistsQuery = {
      text: "SELECT * FROM users WHERE email = $1",
      values: [email],
    };

    const { rows: emailRows } = await pool.query(emailExistsQuery);

    if (emailRows.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Email already exists",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: 400,
        message: "Passwords do not match",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Thêm người dùng mới vào bảng "users"
      const newUserQuery = {
        text: "INSERT INTO users (name, username, email, password) VALUES ($1, $2, $3, $4) RETURNING id",
        values: [name, username, email, hashedPassword],
      };

      const { rows: newUserRows } = await client.query(newUserQuery);
      const userId = newUserRows[0].id;

      let roleId;

      // Kiểm tra nếu vai trò đã tồn tại trong bảng "roles"
      const roleQuery = {
        text: "SELECT * FROM roles WHERE name = $1",
        values: [role],
      };

      const { rows: roleRows } = await client.query(roleQuery);

      if (roleRows.length > 0) {
        roleId = roleRows[0].id;
      } else {
        // Nếu vai trò chưa tồn tại, thêm mới vào bảng "roles"
        const newRoleQuery = {
          text: "INSERT INTO roles (name) VALUES ($1) RETURNING id",
          values: [role],
        };

        const { rows: newRoleRows } = await client.query(newRoleQuery);
        roleId = newRoleRows[0].id;
      }

      // Thêm mối quan hệ user_role
      const userRoleQuery = {
        text: "INSERT INTO user_role (user_id, role_id) VALUES ($1, $2)",
        values: [userId, roleId],
      };

      await client.query(userRoleQuery);

      await client.query("COMMIT");

      res.status(201).json({
        status: 201,
        message: "User created successfully",
        data: {
          id: userId,
          name,
          username,
          email,
          role,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const usernameQuery = {
      text: `
      SELECT users.id, users.name, users.username, roles.name AS role, users.password
      FROM users
      INNER JOIN user_role ON users.id = user_role.user_id
      INNER JOIN roles ON user_role.role_id = roles.id
      WHERE users.username = $1
    `,
      values: [username],
    };

    const { rows } = await pool.query(usernameQuery);

    if (rows.length === 0) {
      return res.status(401).json({
        status: 401,
        message: "Username does not exist",
      });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        status: 401,
        message: "Invalid password",
      });
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
    );
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES }
    );

    res.status(200).json({
      status: 200,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({
      status: 200,
      message: "Logout successful",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

export const refreshToken = (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        status: 401,
        message: "Refresh token not provided",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const userId = decoded.userId;
    const name = decoded.name;
    const username = decoded.username;
    const role = decoded.role;
    const accessToken = jwt.sign(
      {
        userId,
        name,
        username,
        role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
    );

    // Trả về accessToken mới
    res.status(200).json({
      status: 200,
      message: "New access token generated successfully",
      data: { accessToken: accessToken },
    });
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      status: 401,
      message: "Invalid refresh token",
    });
  }
};

export const profile = async (req, res) => {
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
    const userId = decoded.userId;

    const userQuery = {
      text: `
      SELECT users.id, users.name, users.username, roles.name AS role
      FROM users
      INNER JOIN user_role ON users.id = user_role.user_id
      INNER JOIN roles ON user_role.role_id = roles.id
      WHERE users.id = $1
    `,
      values: [userId],
    };

    const { rows } = await pool.query(userQuery);

    if (rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    const user = rows[0];

    const expiresIn = decoded.exp * 1000 - Date.now();
    const expiresInInSeconds = Math.ceil(expiresIn / 1000);
    const expirationDate = new Date(decoded.exp * 1000);

    res.status(200).json({
      status: 200,
      message: "User get profile successfully",
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        expiresIn: expiresInInSeconds,
        expirationDate: expirationDate,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};
