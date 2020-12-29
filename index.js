const express = require('express');
const app = express();
var qs = require("querystring");
var session = require('express-session');
const url = require('url');
const fs = require('fs');//to acces file from fs
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const mongo = require("mongodb");
var MongoClient = mongo.MongoClient;

const uri ="mongodb://localhost:27017";
const client = new MongoClient(uri,{useNewUrlParser: true},function (err, db) {});

app.use(session({
	secret: 'secret',
  resave: true,
  cookie: { maxAge: 8*60*60*1000 },
	saveUninitialized: true
}));

app.use(express.static(__dirname + '/public'));

app.get("/socket.io",(req, res)=>{
	res.sendFile(__dirname + "/node_modules/socket.io/client-dist/socket.io.js");
});


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

app.get("/get_users",(req, res)=>{
  MongoClient.connect(uri, function(err, db) {
    var dbc = db.db("messenger");
    ////////////////////////////////////////////////////// de returnat userii care cu numele de forma req.query.searchString
    //si de returnat în format json
    obj={"username": { "$regex": req.query.searchString }};
    console.log(obj);
    dbc.collection("conturi").find(obj).toArray(function(err, result) {
      if (err)
        throw err;
      console.log("r--------------"+result);
    });
    /////////////////////////////////////////////////////
    db.close();
  });
  res.send('["q","qbone","quintal"]');
});

app.get("/send_message",(req, res)=>{
var date_ob = new Date(Date.now());
var date=date_ob.getDate()+"."+date_ob.getMonth()+"."+date_ob.getFullYear();

var time = date_ob.getHours()+"."+date_ob.getMinutes()+"."+date_ob.getSeconds();

var message={"from": req.session.username, "to": req.query.to, "msg": req.query.message, "date": date, "time": time};

//insert message to db
MongoClient.connect(uri, function(err, db) {
	if (err) throw err;
	var dbc = db.db("messenger");
	dbc.collection("messages").insertOne(message, function(err, ress) {
	  if (err) throw err;
	  //redirect to / and display acount created
	  res.send("1");
	  db.close();
	});
  });
//create delivery sockets
});

app.get("/get_messages",(req, res)=>{
	var to=req.query.to;
	var mlist=[]
	MongoClient.connect(uri, function(err, db) {
		var dbc = db.db("messenger");
		//to user
		console.log(to);
		dbc.collection("messages").find({"from": to}).toArray(function(err, result) {
		  if (err)
			throw err;
			for (i in result)
				mlist.push(result[i]);
		});
		//from user
		console.log(req.session.username);
		dbc.collection("messages").find({"from": req.session.username}).toArray(function(err, result) {
			if (err)
			  throw err;
			  for (i in result)
				mlist.push(result[i]);
			res.send(mlist);
		});
		db.close();
	});
});
//socket 
io.on('connection', function(socket){
	socket.on('chat message', function(msg){
	  io.emit('chat message', msg);
	});
});
//socket
app.get("*",(req, res)=>{
  res.sendFile(__dirname + '\\public\\html\\404.html');
});

http.listen(80, () => {
  console.log('listening on *:80');
}); 
