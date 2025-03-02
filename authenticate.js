require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const User = require('./Users');
const cors = require('cors');
const router = express.Router();
const cookieParser = require("cookie-parser");

// Allow both local and production origins
router.use(cors({ 
    origin: ['http://localhost:3000', 'https://dripfit.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // important to allow cookies
}));

router.use(cookieParser());

const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies.jswtoken;
        console.log('Token:', token);
        if (!token) {
            return res.status(401).send('Unauthorized: No token provided');
        }

        const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
        console.log('Verified Token:', verifyToken);
        const rootUser = await User.findOne({ _id: verifyToken._id, "tokens.token": token });
        console.log('Root User:', rootUser);

        if (!rootUser) {
            return res.status(401).send('Unauthorized: User not found');
        }

        req.token = token;
        req.rootUser = rootUser;
        req.userId = rootUser._id;
        next();
    } catch (err) {
        console.error('Authentication error:', err);
        res.status(401).send('Unauthorized: Invalid token');
    }
};

module.exports = authenticate;
