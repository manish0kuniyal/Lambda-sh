// index.js
const express = require('express');
const serverless = require('serverless-http');

const app = express();
app.use(express.json());

// strip stage prefix middleware (safe, handles when API Gateway includes the stage in the forwarded path)
const STAGE = '/prod';
app.use((req, res, next) => {
  if (req.url.startsWith(STAGE)) {
    req.url = req.url.replace(new RegExp('^' + STAGE), '') || '/';
  }
  next();
});

// Normal route
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Express /hello' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express / (root)' });
});

// Debug endpoint to inspect exactly what API Gateway forwarded
app.get('/_debug', (req, res) => {
  res.json({
    path: req.path,
    originalUrl: req.originalUrl,
    url: req.url,
    method: req.method,
    headers: req.headers
  });
});

// Catch-all to show unmatched requests
app.use((req, res) => {
  res.status(404).json({
    message: 'Express 404',
    debug: { path: req.path, originalUrl: req.originalUrl, url: req.url, method: req.method }
  });
});

module.exports.handler = serverless(app);

// // optional local runner
// if (require.main === module) {
//   const port = process.env.PORT || 3000;
//   app.listen(port, () => console.log(`Local server on http://localhost:${port}`));
// }
