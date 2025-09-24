const serverless = require('serverless-http');
const express = require('express');

const app = express();
app.use(express.json());

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Lambda + Express!' });
});

app.post('/echo', (req, res) => {
  res.json({ youSent: req.body });
});

// export the lambda handler
module.exports.handler = serverless(app);
