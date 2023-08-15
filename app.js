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
    password: String
 });
 userSchema.plugin(passportLocalMongoose);
 userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields:["password"]})


 //the model
 const User = mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


 app.get("/",function(request,response){
    response.render("home");
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

 app.get("/secrets",function(request,response){
   if(request.isAuthenticated()){
    response.render("secrets");
   }else{
    response.redirect("/");
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




 app.listen(3000, function(){
    console.log("Server has started on port 3000");
});
