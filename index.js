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
const { Console } = require('console');

var MongoClient = mongo.MongoClient;

socketIds=[];

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
          res.redirect("/?err=0");
        db.close();
        });
      });
    }
  });
});

app.get("/log_out",(req, res)=>{
	req.session.destroy();
	return res.redirect("/");
});

app.get("/get_users",(req, res)=>{//get users based on a search string
	MongoClient.connect(uri, function(err, db) {
		var dbc = db.db("messenger");
		ss=req.query.searchString;
		obj={"username": { $regex: new RegExp(ss.toLowerCase(),"i") }};
		dbc.collection("conturi").find(obj).toArray(function(err, result) {
			list=[];
			for(i in result)
				list.push(result[i].username);
			res.send(list);
		});
		db.close();
	});
});


function removeItemOnce(arr, value) {
	var index = arr.indexOf(value);
	if (index > -1) {
	  arr.splice(index, 1);
	}
	return arr;
  }

app.get("/get_recent_users",(req, res)=>{//get users based on a session
	var username=req.session.username;
	console.log(username);
	MongoClient.connect(uri, function(err, db) {
		var dbc = db.db("messenger");
		list=[];
		console.log(username);
		var search_obi={"$or": [{"from": { "$eq": username }},{"to":{"$eq": username}}]};
		console.log(search_obi);
		//dbc.collection("messages").distinct("to")
		dbc.collection("messages").find(search_obi).sort({"date":-1}).toArray(function(err, result){//
			for (i in result){
				list.push(result[i].to);
				list.push(result[i].from);
			}
			res.send(removeItemOnce(Array.from(new Set(list)),""));
		});
		db.close();
	});
});

app.get("/send_message",(req, res)=>{
var message={"from": req.session.username, "to": req.query.to, "msg": req.query.message, "date": new Date(Date.now())};
//insert message to db
	MongoClient.connect(uri, function(err, db) {
		var dbc = db.db("messenger");
		dbc.collection("messages").insertOne(message, function(err, ress) {
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
		dbc.collection("messages").find().sort({"date":1}).toArray(function(err, result) {
			for (i in result)
				if(result[i].to==to && result[i].from==req.session.username || result[i].to==req.session.username && result[i].from==to)
					mlist.push(result[i]);
			res.send(mlist);
		});
	});
});

app.get("/get_username",(req, res)=>{
	res.send(req.session.username);
});

//conect to socket 
io.on('connection', function(socket){
	//console.log("am primit: "+socket.id)//-----------------------------in progres
	socket.on('set_online',(data)=>{//se user online
		socketIds.push({[data.username] : socket.id});
		//	.log(socketIds);
	});
	socket.on('message', function(data){//when receive message on socket
		var message={"from": data.from, "to": data.to, "msg": data.msg, "date": new Date(Date.now())};
		//insert message to db
		MongoClient.connect(uri, function(err, db) {
			var dbc = db.db("messenger");
			dbc.collection("messages").insertOne(message, function(err, ress) {
				db.close();
			});
		});//end inreg
		
		
		for (i in socketIds)
			if(socketIds[i][data.to] != null){
				//send mesage trough socket to a specific user that is online
				io.to(socketIds[i][data.to]).emit('message', data);
				notifier.notify({//send notification for new nwssage
					title: 'New message',
					icon: __dirname+'/public/imagini/notify_icon.jpg',
					message: data.msg
				});
			}
	});
});
//socket end

app.get("*",(req, res)=>{
	res.sendFile(__dirname + '/public/html/404.html');
});

http.listen(80, () => {
	console.log('listening on *:80');
}); 
