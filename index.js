
import express from 'express'
import serverless from 'serverless-http'
import cors from 'cors'
import authRouter from "./routes/auth.js"
import feedbackRouter from "./routes/feedback.js";
import formsRouter from "./routes/form.js";
import usersRouter from "./routes/user.js";
import cookieParser from 'cookie-parser';

import connectDB from "./utils/dbconnect.js"

import dotenv from "dotenv";

import chatRoute from "./routes/chat.js"

dotenv.config();

// console.log("DEBUG ENV:", {
//   BASE_URL: process.env.PAYPAL_BASE_URL,
//   CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? "✅" : "❌",
//   SECRET: process.env.PAYPAL_SECRET ? "✅" : "❌"
// });

// import * as Paypal from "./services/paypal.js"

const app = express();

app.use(express.json());
app.use(cookieParser());

const port=5000

await connectDB()

const STAGE = process.env.STAGE || 'prod';
app.use((req, res, next) => {
  if (req.url === `/${STAGE}`) {
    req.url = '/';
  } else if (req.url.startsWith(`/${STAGE}/`)) {
    req.url = req.url.replace(new RegExp('^/' + STAGE), '') || '/';
  }
  next();
});
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173","https://dev.feedbyx.com","https://main.d3jt2wtqx08knj.amplifyapp.com"],
    credentials: true,
  methods: ["GET","HEAD","PUT","PATCH","POST","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



app.get('/', (req, res) => {
  res.json({ message: '...Express live ✅🔥🔥 ' });
});



app.use("/api/auth", authRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/forms", formsRouter);
app.use("/api/users", usersRouter);
app.use("/api",chatRoute)

// test it without
app.get('/_debug', (req, res) => {
  res.json({
    path: req.path,
    originalUrl: req.originalUrl,
    url: req.url,
    method: req.method,
    headers: req.headers
  });
});



app.use((req, res) => {
  res.status(404).json({
    message: 'Express 404',
    debug: { path: req.path, originalUrl: req.originalUrl, url: req.url, method: req.method }
  });
});

export const handler = serverless(app);

  app.listen(port, () => console.log(`Local server on http://localhost:${port}`));
