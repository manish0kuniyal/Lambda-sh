import express from "express";
import {
  createForm,
  getFormsByUser,
  getFormById,
  updateForm,
  deleteForm,
} from "../controllers/formController.js";

const router = express.Router();

router.post("/", createForm);
router.get("/", getFormsByUser);
router.get("/:id", getFormById);
router.patch("/:id", updateForm);
router.delete("/:id", deleteForm);

export default router;
