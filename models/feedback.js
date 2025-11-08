
import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  formId: { type: String, required: true },
  formName: { type: String, required: true },

  responses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true,
  },

  metadata: {
    utm: { type: Map, of: String, default: {} },
    referrer: { type: String, default: "" },     
    pageUrl: { type: String, default: "" },     
    userAgent: { type: String, default: "" },    

    // location: {
    //   lat: { type: Number },
    //   lng: { type: Number },
    //   accuracy: { type: Number },
    // },

    locationLabel: { type: String, default: "" },

    // locationGeo: {
    //   city: { type: String, default: null },
    //   region: { type: String, default: null },
    //   country: { type: String, default: null },
    //   label: { type: String, default: "" },
    //   lat: { type: Number, default: null }, 
    //         lon: { type: Number, default: null },
    // },

    // ipGeo: {
    //   city: { type: String, default: null },
    //   region: { type: String, default: null },
    //   country: { type: String, default: null },
    //   label: { type: String, default: "" }
    // },
  },

    timeOnPage: { type: Number, default: 0 },
  clientIp: { type: String, default: "" }, 
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Feedback ||
  mongoose.model("Feedback", feedbackSchema);
