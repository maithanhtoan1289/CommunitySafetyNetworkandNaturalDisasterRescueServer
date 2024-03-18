import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import naturalDisasterRoutes from "./routes/natural-disaster.routes.js";
import problemRoutes from "./routes/problem.routes.js";
import historyRoutes from "./routes/history.routes.js";

import { connectToDB } from "./config/connectToDB.js";

const app = express();
app.use(bodyParser.json());

dotenv.config();
const PORT = process.env.PORT || 5000;

app.use(express.static("public"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/natural-disasters", naturalDisasterRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/histories", historyRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectToDB();
});
