import jwt from "jsonwebtoken";

const authMiddleware = (requiredRoles) => {
  return (req, res, next) => {
    try {
      // Lấy token từ header
      const token = req.headers.authorization;

      // Kiểm tra token
      if (!token) {
        return res.status(401).json({
          status: 401,
          message: "Access token not provided",
        });
      }

      // Xác thực token và lấy thông tin người dùng từ token
      const accessToken = token.split(" ")[1];
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

      // Kiểm tra vai trò của người dùng
      const userRole = decoded.role;

      // Kiểm tra xem vai trò của người dùng có trong danh sách các vai trò yêu cầu không
      if (!requiredRoles.includes(userRole)) {
        return res.status(403).json({
          status: 403,
          message: "Unauthorized access",
        });
      }

      // Nếu tất cả các điều kiện đều đúng, cho phép tiếp tục thực hiện các middleware và xử lý request
      next();
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: 500,
        message: "Internal server error",
      });
    }
  };
};

export default authMiddleware;
