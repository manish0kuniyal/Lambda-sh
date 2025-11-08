import { v4 as uuidv4 } from "uuid";
import Form from "../models/form.js";
import Feedback from "../models/feedback.js";

async function findFormByIdentifier(idOrCustom) {
  if (!idOrCustom) return null;
  let f = await Form.findOne({ customId: idOrCustom });
  if (f) return f;
  if (/^[0-9a-fA-F]{24}$/.test(String(idOrCustom))) {
    try {
      f = await Form.findById(idOrCustom);
      return f;
    } catch {
      return null;
    }
  }
  return null;
}

export const createForm = async (req, res) => {
  try {
    const { name, uid, fields } = req.body;
    if (!name || !uid || !fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: "Name, UID, and at least one field are required." });
    }

    const formId = uuidv4();
    const newForm = await Form.create({
      name,
      customId: formId,
      userId: uid,
      fieldType: fields,
    });

    return res.json({ message: "Form created", form: newForm });
  } catch (err) {
    console.error("Create form error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getFormsByUser = async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.json({ forms: [] });
    const allForms = await Form.find({ userId: uid }).lean();
    return res.json({ forms: allForms });
  } catch (err) {
    console.error("Get forms error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getFormById = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await findFormByIdentifier(id);
    if (!form) return res.status(404).json({ error: "Form not found" });

    await Form.updateOne({ _id: form._id }, { $inc: { viewCount: 1 } });
    return res.json(form);
  } catch (err) {
    console.error("Get single form error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { paused, feedbackLimit } = req.body;
    const updates = {};

    if (typeof paused === "boolean") updates.paused = paused;

    if (feedbackLimit === null) {
      updates.feedbackLimit = null;
    } else if (feedbackLimit !== undefined) {
      if (typeof feedbackLimit !== "number" || !Number.isFinite(feedbackLimit) || !Number.isInteger(feedbackLimit) || feedbackLimit < 0) {
        return res.status(400).json({ error: "feedbackLimit must be a non-negative integer or null" });
      }
      updates.feedbackLimit = Math.floor(feedbackLimit);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const form = await findFormByIdentifier(id);
    if (!form) return res.status(404).json({ error: "Form not found" });

    if (updates.feedbackLimit !== undefined && updates.feedbackLimit !== null) {
      if (form.feedbackCount > updates.feedbackLimit) {
        return res.status(400).json({
          error: `Cannot set feedbackLimit to ${updates.feedbackLimit} because current feedbackCount is ${form.feedbackCount}`,
        });
      }
    }

    const updated = await Form.findByIdAndUpdate(form._id, { $set: updates }, { new: true }).lean();
    return res.json({ message: "Form updated", form: updated });
  } catch (err) {
    console.error("Patch form error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await findFormByIdentifier(id);
    if (!form) return res.status(404).json({ error: "Form not found" });

    await Form.deleteOne({ _id: form._id });
    const feedbackDeleteResult = await Feedback.deleteMany({ formId: form.customId });

    return res.json({
      message: "Form and associated feedback deleted",
      form,
      deletedFeedbackCount: feedbackDeleteResult.deletedCount ?? 0,
    });
  } catch (err) {
    console.error("Delete form error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
