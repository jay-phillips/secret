//jshint esversion:6
require('dotenv').config();
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const md5 = require("md5");
const bcrypt = require("bcrypt");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require("mongoose-findorcreate");
const saltRounds = 10;




const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));


app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected Successfully")
});

const userSchema = new mongoose.Schema({

    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User =  new mongoose.model('User', userSchema);


passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));


app.get("/", function(req, res){

    res.render("home");

});

app.get("/auth/google", 
    passport.authenticate("google", { scope: ['profile']} )
);

app.get( '/auth/google/secrets', 
    passport.authenticate( 'google', { 
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));

app.get("/register", function(req, res){

    res.render("register");

    

})

app.get("/secrets", function(req, res){
    User.find({"secret": {$ne: null }}, function(err, foundUsers){
        if(err){
            console.log(err);
        } else {
            if (foundUsers){
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    })
 })

 app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
   }else{
       res.redirect("/login");
   }

 })

 app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    
    console.log(req.user.id);

    User.findById(req.user.id, function(err, foundUser){
        if (err){
            console.log(err);
        } else {
            if (foundUser){
                foundUser.secret = submittedSecret;
            
                foundUser.save(function(){

                    res.redirect("/secrets");

                })
            }
        }
    })


 })
 
 app.get("/logout", function(req, res){
     req.logout();
     res.redirect("/");
 })

app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register")
        } else {
        passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
        })
        }
    })



   /* bcrypt.hash(req.body.password, saltRounds, function(err, hash){

        const emailEntered = req.body.username;
       


        const newUser = new User({

            email: emailEntered,
            password:md5(hash)
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

    */

  
})

app.get("/login", function(req, res){

    res.render("login");
})

app.post("/login", function(req, res){

    
   const user = new User({
       username: req.body.username,
       password: req.body.password
   });

   req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
          passport.authenticate("local")(req, res, function(){

           res.redirect("/secrets");
          })
            
        }

   })



    
    /*bcrypt.hash(req.body.password, saltRounds, function(err, hash){
    const emailReq = req.body.username;
   

    User.findOne({email: emailReq}, {password: hash}, function(err, foundData){
        
        console.log(foundData);

        if(foundData){
            res.render("secrets")
        }else{
            console.log(err);
        }

    })
})*/
})







app.listen(3000, function(){
   
 console.log("Listening on port 3000!")
});