import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import Feedback from "../models/feedback.js";
import Form from "../models/form.js";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const handleChat = async (req, res) => {
  try {
    const { formId, query } = req.body;
    if (!formId || !query)
      return res.status(400).json({ error: "formId and query are required" });

    const form = await Form.findOne({ customId: formId });
    if (!form) return res.status(404).json({ error: "Form not found" });

    const feedbacks = await Feedback.find({ formId }).lean();
    const feedbackText = feedbacks
      .map((fb) => JSON.stringify(fb.responses))
      .join("\n");

    const prompt = `
You are an assistant for the Feedbyx platform. You analyze form feedback and user responses.
Form Name: ${form.name}

Feedback Data (sampled):
${feedbackText.slice(0, 5000)}

User question:
"${query}"

Answer clearly and only using the provided feedback data.
`;

    const input = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 400,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    };

    const command = new InvokeModelCommand({
      modelId:
        process.env.BEDROCK_MODEL_ID ||
        "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(input),
    });

    const response = await client.send(command);
    const result = JSON.parse(Buffer.from(response.body).toString("utf8"));
    const answer = result?.content?.[0]?.text || "No response from AI.";
    res.json({ answer });
  } catch (err) {
    console.error("Chat API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
