//jshint esversion:6
require('dotenv').config();
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected Successfully")
});

const userSchema = new mongoose.Schema({

    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);


app.get("/", function(req, res){

    res.render("home");

});


app.get("/register", function(req, res){

    res.render("register");

    

})

app.post("/register", function(req, res){
    const emailEntered = req.body.username;
    const passwordEntered = req.body.password;


    const newUser = new User({

        email: emailEntered,
        password: passwordEntered
    })

    newUser.save(function(err){
      if (err){
        console.log(err);
      }
      else{
          console.log("Successfully Added");

      }
    })
    res.render("home");

  
})

app.get("/login", function(req, res){

    res.render("login");
})

app.post("/login", function(req, res){
    
    
    const emailReq = req.body.username;
    const passwordReq = req.body.password;

    User.findOne({email: emailReq}, {password: passwordReq}, function(err, foundData){
        
        console.log(foundData);

        if(foundData){
            res.render("secrets")
        }else{
            console.log(err);
        }

    })
})


app.get("/secrets", function(req, res){



    res.render("secrets");
})




app.listen(3000, function(){
   
 console.log("Listening on port 3000!")
});