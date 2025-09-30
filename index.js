// index.js
// const express = require('express');
// const serverless = require('serverless-http');
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
dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());

const port=5000

await connectDB()

const STAGE = process.env.STAGE || 'prod';
app.use((req, res, next) => {
  // if url is like '/prod' or '/prod/hello', remove the leading '/prod'
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

// catch-all
app.use((req, res) => {
  res.status(404).json({
    message: 'Express 404',
    debug: { path: req.path, originalUrl: req.originalUrl, url: req.url, method: req.method }
  });
});

export const handler = serverless(app);

  // app.listen(port, () => console.log(`Local server on http://localhost:${port}`));
