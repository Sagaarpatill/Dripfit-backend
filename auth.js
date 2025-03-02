require('dotenv').config();
const express = require('express');
const router = express.Router();
const User = require('./Users');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const mongoose = require('mongoose')
const authenticate = require('./authenticate')
const cookieParser = require("cookie-parser");

const connection_url = process.env.MONGO_URL;
mongoose.connect(connection_url);


router.use(cookieParser());
router.use(cors({ 
  origin: 'http://localhost:3000', // Replace with the actual origin of your frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  secure: process.env.NODE_ENV === 'production',
}));


router.use(express.json());
router.post('/register',async (req,res) =>{
    const {name,email,password} = req.body;
  
    if(!name || !email || !password)
    {
      return res.status(422).json({error: "Fill all the fields !"});
    }
  
    try {
      const userExist = await User.findOne({email: email});
  
      if(userExist) {
        return res.status(422).json({error : "Email already registered"});
      }
  
      const user = new User({name, email, password});
  
      const userConfirm = await user.save();
  
      if(userConfirm) {
        res.status(201).json({message: "User registered successfully!"});
      } else {
        res.status(500).json({error: "Failed to register"})
      }
    } catch (err)
      {
        console.log(err);
      }
  
  })
  

router.post('/signin', async (req, res) =>{
    try {
        let token;
        const {email, password } =req.body;

        if(!email || !password) {
            return res.status(400).json({error:"Please Fill out all fields!"})
        }

        const userLogin = await User.findOne({email: email});

        if(userLogin) {
            const isMatch = await bcrypt.compare(password, userLogin.password);

            token = await userLogin.generateAuthToken();
            console.log("auth Token : ",token);

            res.cookie('jswtoken',token, {
                expires:new Date(Date.now() + 3600000),
                sameSite: 'None',
                httpOnly:true,
                path: '/', 
                secure: true
            });

        if(!isMatch)
        {
            res.status(400).json({error: "Invalid Credentials"});
        } else {
            res.json({message: "Login Succeessfull!",token});
            
        }

        } else{
            res.status(400).json({error: "Invalid Credentials"});
        }
    } catch (err){
        console.log(err);
    }
})

router.get('/user', authenticate, async (req,res) => {
    res.send(req.rootUser);
})


router.get('/logout', async (req,res) => {
  console.log("Cookie cleared!")
    res.clearCookie('jswtoken',{path: '/'});
    res.status(200).send("User Loged Out!")
})




module.exports = router;