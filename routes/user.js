import express from "express";
import User from "../models/user.js";

const router = express.Router();

// Save new user
router.post("/save", async (req, res) => {
  const { name, email, image, uid } = req.body;

  if (!name || !email || !uid) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let user = await User.findOne({ userId: uid }); // use userId here
  if (!user) {
    user = await User.create({
      userId: uid, // map uid -> userId
      name,
      email,
      provider: 'google', // optional
    });
  }

  return res.json({ success: true, user });
});


export default router;
