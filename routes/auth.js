import express from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.js";
import jwt from "jsonwebtoken";

const router = express.Router(); // <-- add this


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
router.post("/google/token", async (req, res) => {
  const token = req.body?.token;
  if (!token) return res.status(400).json({ message: "Token not provided" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    let user = await User.findOne({ userId: payload.sub });

    if (!user) {
      user = await User.create({
        userId: payload.sub,
        name: payload.name,
        email: payload.email,
        image: payload.picture,
        provider: "google",
      });
    }

    const jwtToken = jwt.sign({ uid: user.userId }, process.env.JWT_SECRET || "123jwt", {
      expiresIn: "7d",
    });

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(401).send("Invalid Google token");
  }
});


// ✅ Get current logged in user
router.get("/me", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "123jwt");
    const user = await User.findOne({ userId: decoded.uid }).select("-__v");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("JWT verify error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});

// ✅ Logout (clear cookie)
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ message: "Logged out" });
});



export default router; // <-- export it
