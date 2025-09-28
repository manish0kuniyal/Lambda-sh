import mongoose from "mongoose";

let isConnected = false;

export default async function connectDB() {
  if (isConnected) {
    console.log("✅ MongoDB already connected");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    isConnected = true;
    console.log(`✅ MongoDB connected: ${db.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}
