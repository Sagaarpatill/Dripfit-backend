require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const User = require('./Users');
const cors = require('cors');
const router = express.Router();
const cookieParser = require("cookie-parser");

router.use(cors({ 
    origin: 'http://localhost:3000', // Replace with the actual origin of your frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: 'include',
  }));
router.use(cookieParser());
const authenticate = async (req,res,next) => {
    try{
        const token = req.cookies.jswtoken;
        console.log('Token:', token);
        const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
        console.log('Verified Token:', verifyToken);
        const rootUser = await User.findOne({_id:verifyToken._id,"tokens.token":token});
        console.log('Root User:', rootUser);

        if(!rootUser){
            res.send('User not found');
        }

        req.token = token;
        req.rootUser = rootUser;
        req.userId = rootUser._id;

        next();
    }
    catch (err) {
        res.status(401).send('Unauthorized: No token provided');
        console.log(err);
    }
}

module.exports = authenticate;