
const serverless = require('serverless-http');
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello 🌱 👍 ');
});

app.get('/echo',(req,res)=>{
    res.json({msg:"hello🌱 "})
})
module.exports.handler = serverless(app);