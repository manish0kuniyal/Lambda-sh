
import mongoose from 'mongoose';

const formSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  customId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  fieldType: [
    {
      type: {
        type: String,
        required: true
      },
     label: { type: String, default: '' },
      options: [String],
      required: {
        type: Boolean,
        default: false
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
    paused: { type: Boolean, default: false },       
    feedbackLimit: { type: Number, default: null }, 
    feedbackCount: { type: Number, default: 0 },
      viewCount: { type: Number, default: 0 },      
  totalTimeSpent: { type: Number, default: 0 },
});

export default mongoose.models.Form || mongoose.model('Form', formSchema);
