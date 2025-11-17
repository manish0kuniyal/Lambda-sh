import express from "express";
import Feedback from "../models/feedback.js";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

function mask(s = "") {
  if (!s) return "<missing>";
  if (s.length <= 8) return "****";
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

async function streamToString(stream) {
  if (!stream) return "";
  if (typeof stream === "string") return stream;
  if (stream instanceof Uint8Array || Buffer.isBuffer(stream)) {
    return new TextDecoder().decode(stream);
  }
  if (typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
  }
  try {
    return new TextDecoder().decode(stream);
  } catch {
    return String(stream);
  }
}

router.use((req, res, next) => {
  console.info(`[${new Date().toISOString()}] Bedrock route invoked: ${req.method} ${req.originalUrl}`);
  console.info(`ENV preview -> AWS_REGION=${process.env.AWS_REGION ?? "<missing>"}, AWS_ACCESS_KEY_ID=${mask(process.env.AWS_ACCESS_KEY_ID)}, AWS_SECRET_ACCESS_KEY=${mask(process.env.AWS_SECRET_ACCESS_KEY)}`);
  if (!process.env.AWS_REGION) {
    return res.status(500).json({ error: "Server misconfiguration: missing AWS_REGION" });
  }
  next();
});

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

router.get("/diagnostics/aws-identity", async (req, res) => {
  try {
    const sts = new STSClient({ region: process.env.AWS_REGION });
    const resp = await sts.send(new GetCallerIdentityCommand({}));
    console.info(`[${new Date().toISOString()}] STS success: arn=${resp.Arn}, account=${resp.Account}`);
    return res.json({ ok: true, caller: { Arn: resp.Arn, Account: resp.Account, UserId: resp.UserId } });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] STS identity check failed`, {
      name: err.name,
      message: err.message,
      metadata: err.$metadata ?? null,
    });
    return res.status(500).json({
      ok: false,
      error: "STS identity check failed",
      name: err.name,
      message: err.message,
      metadata: err.$metadata ?? null,
    });
  }
});

async function sendWithTimeout(client, command, ms = 20000) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Bedrock request timed out")), ms);
  });
  try {
    const sendPromise = client.send(command);
    const resp = await Promise.race([sendPromise, timeoutPromise]);
    return resp;
  } finally {
    clearTimeout(timeout);
  }
}

router.post("/chat", async (req, res) => {
  const startTs = Date.now();
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
        Object.entries(f.responses || {})
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
      modelId: process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }],
          },
        ],
      }),
    });

    const response = await sendWithTimeout(bedrock, command, Number(process.env.BEDROCK_TIMEOUT_MS) || 20000);
    const bodyText = await streamToString(response.body);
    let decoded;
    try {
      decoded = JSON.parse(bodyText);
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Failed to parse Bedrock response body as JSON`, { error: e.message, bodyText });
      return res.status(502).json({ error: "Invalid response from Bedrock", bodyText });
    }

    const answer = decoded?.content?.[0]?.text || "No response generated";
    console.info(`[${new Date().toISOString()}] Bedrock success (ms=${Date.now() - startTs})`);
    return res.json({ success: true, answer });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Chat API error`, {
      name: err.name,
      message: err.message,
      stack: err.stack,
      metadata: err.$metadata ?? null,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      name: err.name,
      message: err.message,
      metadata: err.$metadata ?? null,
    });
  }
});

export default router;
