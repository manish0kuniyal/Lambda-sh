import express from "express";
import { saveFeedback, getFeedbacks } from "../controllers/feedbackController.js";

const router = express.Router();

router.post("/", saveFeedback);
router.get("/", getFeedbacks);

export default router;
