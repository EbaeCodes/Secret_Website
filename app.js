//jshint esversion:6
require("dotenv").config();
const md5 = require("md5");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const salt = 10;
const ejs = require("ejs");
const app = express();

// Replace the uri string with your connection string.
mongoose.connect("mongodb://localhost:27017/secretDB",{useNewUrlParser:true});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));// to save our css files


const userSchema = new mongoose.Schema({
    email : String,
    password: String
 });
 userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields:["password"]})


 //the model
 const User = mongoose.model("User", userSchema);


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

 app.post("/register",function(request,response){
    bcrypt.hash(request.body.password, salt, async(err, hash)=> {
        // Store hash in your password DB.
         const newUser = new User({
            email:request.body.username,
            password: hash
          });
          await newUser.save().then(()=> response.render("secrets"));
    }) 
 });

 -
 app.post("/login",async(request,response)=>{
      const email = request.body.username;
      const password = request.body.password;
      const found = await User.findOne({email:email});

      bcrypt.compare(password, found.password, function(err, result) {
        if(result === true){
            response.render("secrets");
        }else{
            var errorMessage = "Incorrect username or password";
            // response.render("login", {error:errorMessage});
            console.log(errorMessage)
        }  
    });
});




 app.listen(3000, function(){
    console.log("Server has started on port 3000");
});
