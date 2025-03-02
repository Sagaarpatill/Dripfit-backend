require('dotenv').config();
const express = require('express');
const router = express.Router();
const User = require('./Users');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const mongoose = require('mongoose');
const authenticate = require('./authenticate');
const cookieParser = require("cookie-parser");

const connection_url = process.env.MONGO_URL;
mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

router.use(cookieParser());
// Allow both local and production origins
router.use(cors({
  origin: ['http://localhost:3000', 'https://dripfit.vercel.app'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  // The secure flag is set dynamically based on NODE_ENV
  secure: process.env.NODE_ENV === 'production',
}));

router.use(express.json());

// Registration endpoint
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(422).json({ error: "Fill all the fields!" });
  }

  try {
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(422).json({ error: "Email already registered" });
    }

    const user = new User({ name, email, password });
    const userConfirm = await user.save();

    if (userConfirm) {
      return res.status(201).json({ message: "User registered successfully!" });
    } else {
      return res.status(500).json({ error: "Failed to register" });
    }
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Signin endpoint
router.post('/signin', async (req, res) => {
  try {
    let token;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please fill out all fields!" });
    }

    const userLogin = await User.findOne({ email });
    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password);

      token = await userLogin.generateAuthToken();
      console.log("Auth Token:", token);

      // Set cookie options
      res.cookie('jswtoken', token, {
        expires: new Date(Date.now() + 3600000), // 1 hour expiry
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      });

      if (!isMatch) {
        return res.status(400).json({ error: "Invalid Credentials" });
      } else {
        return res.json({ message: "Login Successful!", token });
      }
    } else {
      return res.status(400).json({ error: "Invalid Credentials" });
    }
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected user endpoint
router.get('/user', authenticate, async (req, res) => {
  res.send(req.rootUser);
});

// Logout endpoint
router.get('/logout', async (req, res) => {
  console.log("Clearing cookie...");
  res.clearCookie('jswtoken', { path: '/' });
  res.status(200).send("User logged out!");
});

module.exports = router;
