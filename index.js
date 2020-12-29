const express = require('express');
const app = express();
var qs = require("querystring");
var session = require('express-session');
const url = require('url');
const fs = require('fs');//to acces file from fs
var http = require('http').createServer(app);
const mongo = require("mongodb");
var MongoClient = mongo.MongoClient;

const uri ="mongodb://localhost:27017";
const client = new MongoClient(uri,{useNewUrlParser: true},function (err, db) {});

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  if (req.session.username!=undefined)//dacă sesiune nu este setată
    return res.redirect("/home")
  res.sendFile(__dirname + '/public/html/login.html');
});

app.get('/login', function(req, res){
  return res.redirect("/home");
});

app.post('/login', function(req, res){
  if (req.session.username!=undefined)//dacă sesiunea nu este setată
    return res.redirect("/home");
  var body="";
  req.on("data", function (data) {
    body +=data;
  });
  req.on("end",function(){
    var variables =  qs.parse(body);
    console.log(variables);
    MongoClient.connect(uri, function(err, db) {
    var dbc = db.db("messenger");
    obj={username: variables.username, password: variables.password};
    dbc.collection("conturi").find(obj).toArray(function(err, result) {
      if (err)
        throw err;
      if(result.length==0){
        console.log("credentiale gresite");
        //de trimis var la user pt cred inv
        return res.redirect("/");
      }else{
        console.log("cred vaide");
        req.session.username=variables.username;
        return res.redirect("/home")
      }      
    });
    db.close();
  });
 });
});

app.get('/home', function(req, res){
  if (req.session.username==undefined)//dacă sesiune nu este setată
    return res.redirect("/")
  res.sendFile(__dirname + '\\public\\html\\home.html');
});

app.get('/inregistrare', function(req, res){
  if (req.session.username!=undefined)//dacă sesiune nu este setată
    return res.redirect("/home");
  res.sendFile(__dirname + '\\public\\html\\inregistrare.html');
});

app.post('/register', function(req, res){
  if (req.session.username!=undefined)//dacă sesiune nu este setată
    return res.redirect("/home");
  var va="";
  req.on("data", function (data) {
    va +=data;
  });
  req.on("end",function(){
    var urlVars =  qs.parse(va);
    console.log(urlVars);
    //efective register
    if(urlVars.username.length==0 || urlVars.password.length==0 || urlVars.mail.length==0)
      res.send("username invalid");
      //redirect to intregistrare and display incorect data
    MongoClient.connect(uri, function(err, db) {
      if (err) throw err;
      var dbc = db.db("messenger");
      dbc.collection("conturi").insertOne(urlVars, function(err, ress) {
        if (err) throw err;
        //redirect to / and display acount created
        res.send("1 rec inserted in db");
        db.close();
      });
    });
  });
});

app.get("/log_out",(req, res)=>{
 // console.log(req.session);
  req.session.destroy();
 // console.log(req.session);
  return res.redirect("/");
});

app.get("*",(req, res)=>{
  res.sendFile(__dirname + '\\public\\html\\404.html');
});

http.listen(80, () => {
  console.log('listening on *:80');
}); 
