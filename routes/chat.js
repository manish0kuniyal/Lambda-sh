import express from "express";
import Feedback from "../models/feedback.js";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post("/chat", async (req, res) => {
  try {
    const { formId, query } = req.body;
    if (!formId || !query) {
      return res.status(400).json({ error: "formId and query are required" });
    }

    const feedbacks = await Feedback.find({ formId }).lean();
    if (!feedbacks.length) {
      return res.status(404).json({ error: "No feedback found for this form" });
    }

    const feedbackText = feedbacks
      .map((f) =>
        Object.entries(f.responses)
          .map(([key, val]) => `${key}: ${val}`)
          .join(", ")
      )
      .join("\n");

    const prompt = `
You are an assistant analyzing user feedback for a form.
Here are all the feedback responses:

${feedbackText}

User's question: "${query}"

Provide a clear, insightful answer based on the feedback.
`;

    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt }
            ],
          },
        ],
      }),
    });

    const response = await bedrock.send(command);
    const decoded = JSON.parse(new TextDecoder().decode(response.body));
    const answer = decoded?.content?.[0]?.text || "No response generated";

    res.json({ success: true, answer });
  } catch (err) {
    console.error("Chat API error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
