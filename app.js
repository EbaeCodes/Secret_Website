//jshint esversion:6
require("dotenv").config();
//const md5 = require("md5");
//const bcrypt = require('bcrypt');
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")
const express = require("express");
const bodyParser = require("body-parser");
const salt = 10;
const ejs = require("ejs");
const app = express();
const session = require('express-session')
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate')

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));// to save our css files

//cookies
app.use(session({
  secret: 'SecretInSecret',
  resave: false,
  saveUninitialized: false,
  //cookie: { secure: true }
}))

app.use(passport.initialize());
app.use(passport.session());

// Replace the uri string with your connection string.
mongoose.connect("mongodb://localhost:27017/secretDB",{useNewUrlParser:true});

const userSchema = new mongoose.Schema({
    email : String,
    password: String,
    googleId: String,
    secret: String
 });
 userSchema.plugin(passportLocalMongoose);
 userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields:["password"]})
 userSchema.plugin(findOrCreate);


 //the model
 const User = mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


 app.get("/",function(request,response){
    response.render("home");
 });

 app.get("/auth/google",
    passport.authenticate("google", { scope: ['profile'] }));
 

app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(request,response) {
      // Successful authentication, redirect home.
      response.redirect('/secrets');
    });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets', 
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(request,response) {
      // Successful authentication, redirect home.
      response.redirect('/secrets');
    });


 app.get("/register",function(request,response){
    response.render("register");
 });

 app.get("/logout",function(request,response){
    response.redirect("/");
 });


 app.get("/login",function(request,response){
    response.render("login");
 });


 app.get("/submit",function(request,response){
    if(request.isAuthenticated()){
        response.render("submit");
       }else{
        response.redirect("/login");
       }
 });


 app.get("/secrets",async(request,response)=>{
    const allFound = await User.find({"secret": {$ne:null}});
    if(allFound){
        response.render("secrets",{userWithSecrets:allFound})
    }
 });

 app.post("/register",function(request,response){
    User.register({username:request.body.username},request.body.password,function(err,user){
        if(err){
            console.log(err);
            response.redirect("/register");
        }else{
            passport.authenticate("local")(request,response,function(){
            response.redirect("/secrets");
            });
        }
    })
 });

 app.post("/login",async(request,response)=>{
   const user = new User({
    username: request.body.username,
    password: request.body.password
   })
    request.login(user,function(err){
        if(err){
            console.log(err)
        }else{
            passport.authenticate("local")(request,response,function(){
                response.redirect("/secrets");
            });
        }
    });
});

app.post("/submit",async(request,response) => {
    const secretSubmit = request.body.secret;
    //Find the current user of the app
     const ID = request.user.id;
     console.log(ID);
     const found = await User.findById({ID});
   
     if(found){
        found.secret = secretSubmit;
        await found.save();
        response.redirect("/secrets"); // to see their secrets
     }else{
        response.render("error"); // to see their secrets
     }
 });




 app.listen(3000, function(){
    console.log("Server has started on port 3000");
});
