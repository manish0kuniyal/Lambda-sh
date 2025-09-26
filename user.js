// const express = require('express');
// const mongoose = require('mongoose');
// const router = express.Router();

// const MONGODB_URI = process.env.MONGODB_URI;

// mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// const userSchema = new mongoose.Schema({
//   name: String,
//   email: String,
// }, { timestamps: true });

// const User = mongoose.model('User', userSchema);

// // Add a user
// router.post('/users', async (req, res) => {
//   try {
//     const user = new User(req.body);
//     await user.save();
//     res.status(201).json(user);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Show all users
// router.get('/users', async (req, res) => {
//   try {
//     const users = await User.find().sort({ createdAt: -1 });
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;

