import express from "express";
import {
  allNaturalDisaster,
  allProblem,
} from "../controllers/history.controllers.js";
import authMiddleware from "../middleware/authMiddleware.js";
import ROLES from "../enums/roles.js";

const router = express.Router();

router.get(
  "/all-natural-disaster",
  authMiddleware([ROLES.ADMIN]),
  allNaturalDisaster
);
router.get("/all-problem", authMiddleware([ROLES.ADMIN]), allProblem);

export default router;
