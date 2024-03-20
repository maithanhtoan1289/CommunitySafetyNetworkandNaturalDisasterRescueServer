import express from "express";
import { all } from "../controllers/employee.controllers.js";
import authMiddleware from "../middleware/authMiddleware.js";
import ROLES from "../enums/roles.js";

const router = express.Router();

router.get("/all", authMiddleware([ROLES.ADMIN]), all);

export default router;
