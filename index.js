const express = require('express');
const app = express();
var qs = require("querystring");
var session = require('express-session');
const url = require('url');
const fs = require('fs');//to acces file from fs
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const mongo = require("mongodb");
const notifier = require('node-notifier');

var MongoClient = mongo.MongoClient;

const uri ="mongodb://localhost:27017";
const client = new MongoClient(uri,{useNewUrlParser: true},function (err, db) {});

app.use(session({
	secret: 'secret',
	resave: true,
	cookie: { maxAge: 8*60*60*1000 },
	saveUninitialized: true
}));

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

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
	var variables =	qs.parse(body);
	MongoClient.connect(uri, function(err, db) {
		var dbc = db.db("messenger");
		obj={username: variables.username, password: variables.password};
		dbc.collection("conturi").find(obj).toArray(function(err, result) {
		if (err)
			throw err;
		if(result.length==0){//credentiale gresite
			return res.redirect("/?err=inv_cred");
		}else{//credentiale valide
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
	if (req.session.username!=undefined)//dacă sesiune este setată
	  return res.redirect("/home");
	res.sendFile(__dirname + '\\public\\html\\inregistrare.html');
});

app.post('/register', function(req, res){
	if (req.session.username!=undefined)//dacă sesiune este setată
	  return res.redirect("/home");
	var va="";
	req.on("data", function (data) {
	va +=data;
	});
	req.on("end",function(){
    var urlVars =	qs.parse(va);
    //efective register
    if(urlVars.username.length==0 || urlVars.mail.length==0 || urlVars.password.length<8 || !validateEmail(urlVars.mail))
      res.redirect("/inregistrare?err=incorect_data");
    else{
      MongoClient.connect(uri, function(err, db) {
        var dbc = db.db("messenger");
        dbc.collection("conturi").insertOne(urlVars, function(err, ress){
        if (err) throw err;
          res.redirect("/?err=0");
        db.close();
        });
      });
    }
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
		ss=req.query.searchString;
		obj={"username": { $regex: new RegExp(ss.toLowerCase(),"i") }};
		dbc.collection("conturi").find(obj).toArray(function(err, result) {
			if (err)
				throw err;
			//console.log("r--------------"+JSON.stringify(result));
			list=[];
			for(i in result)
				list.push(result[i].username);
			res.send(list);
		});
		
		db.close();
	});
});

app.get("/send_message",(req, res)=>{

var message={"from": req.session.username, "to": req.query.to, "msg": req.query.message, "date": new Date(Date.now())};

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
});

app.get("/get_messages",(req, res)=>{
	var to=req.query.to;
	var mlist=[]
	MongoClient.connect(uri, function(err, db) {
		var dbc = db.db("messenger");
		//noe varrrrrr
		//.limit(yourValue);	
		dbc.collection("messages").find().sort({"date":1}).toArray(function(err, result) {
			if (err)
				throw err;
				for (i in result)
					if(result[i].to==to && result[i].from==req.session.username || result[i].to==req.session.username && result[i].from==to)
						mlist.push(result[i]);
			res.send(mlist);
		});
	});
});
//socket 
io.on('connection', function(socket){
	socket.on('chat message', function(msg){
    //console.log("am primit: "+msg)-----------------------------in progres
    io.emit('chat message', msg);
    
    notifier.notify({
	  title: 'New message',
	  icon: __dirname+'/public/imagini/notify_icon.jpg',
      message: msg
    });

	});
});
//socket
app.get("*",(req, res)=>{
	res.sendFile(__dirname + '\\public\\html\\404.html');
});

http.listen(80, () => {
	console.log('listening on *:80');
}); 
