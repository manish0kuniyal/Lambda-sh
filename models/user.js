import mongoose from "mongoose";
const userSchema=new mongoose.Schema({
     userId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  provider: {
    type: String,
    default: 'google',
  }, createdAt: {
    type: Date,
    default: Date.now,
  }
})

export default mongoose.models.User || mongoose.model('User', userSchema);
