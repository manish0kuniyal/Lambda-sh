// index.js
const express = require('express');
const serverless = require('serverless-http');
const userRouter=require('./user')
const app = express();
app.use(express.json());


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
app.use('/', userRouter);
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Express ⚡' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express / (root)' });
});

// debug route
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

module.exports.handler = serverless(app);

// if (require.main === module) {
//   const port = process.env.PORT || 3000;
//   app.listen(port, () => console.log(`Local server on http://localhost:${port}`));
// }
