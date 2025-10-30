import express from "express";
import User from "../models/user.js";
import { saveUser } from "../controllers/authController.js";

const router = express.Router();
router.post("/save",saveUser)
export default router;
