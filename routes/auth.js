import express from "express";
import {
  googleLogin,
  getCurrentUser,
  logoutUser,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/google/token", googleLogin);
router.get("/me", getCurrentUser);
router.post("/logout", logoutUser);

export default router;
