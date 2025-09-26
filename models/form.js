
// export default mongoose.models.Form || mongoose.model('Form', formSchema);
import mongoose from 'mongoose';

const formSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  customId: {
    type: String, // e.g. Date.now().toString()
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
        type: String, // "input", "textarea", "rating", etc.
        required: true
      },
     label: { type: String, default: '' },
      options: [String], // for radio buttons, dropdowns, etc.
      required: {
        type: Boolean,
        default: false
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Form || mongoose.model('Form', formSchema);
