//jshint esversion:6
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")
const express = require("express");
const bodyParser = require("body-parser");
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

 const mySecret = "PHurn%tesvclvkpun"; 
 userSchema.plugin(encrypt,{secret:mySecret, encryptedFields:["password"]})

 
 //the model
 const User = mongoose.model("User", userSchema);


 app.get("/",function(request,response){
    response.render("home");
 });

 app.get("/register",function(request,response){
    response.render("register");
 });

 app.get("/login",function(request,response){
    response.render("login");
 });

 app.post("/register",async(request,response)=>{
     const newUser = new User({
       email:request.body.username,
       password: request.body.password 
     });
     await newUser.save().then(()=> response.render("secrets"));
 });

 app.post("/login",async(request,response)=>{
      const email = request.body.username;
      const password = request.body.password;

      const found = await User.findOne({email:email});

      if(found){
        if(found.password === password){
            response.render("secrets");
        }else{
            var errorMessage = "Incorrect username or password";
            // response.render("login", {error:errorMessage});
            console.log(errorMessage)
        }  
      }
});








 app.listen(3000, function(){
    console.log("Server has started on port 3000");
});
