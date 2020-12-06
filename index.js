const express = require('express');
const app = express();
const url = require('url');
const fs = require('fs');//to acces file from fs
var http = require('http').createServer(app);
const mongo = require("mongodb");
var MongoClient = mongo.MongoClient;

const uri ="mongodb://localhost:27017";
const client = new MongoClient(uri);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  
  var urlVars = url.parse(req.url,true).query;
  var nr_param=Object.keys(urlVars).length;
  console.log(nr_param);
  //login
  var urlVars = url.parse(req.url,true).query;
  urlVars=JSON.parse(JSON.stringify(urlVars));
  MongoClient.connect(uri, function(err, db) {
    var dbc = db.db("messenger");
    obj={username: urlVars["username"], password: urlVars["password"]};
    dbc.collection("conturi").find(obj).toArray(function(err, result) {
      if (err) throw err;
      
        if(nr_param==0){//redirect PRIMITIVVVVVVVVVV
          res.sendFile(__dirname + '\\public\\html\\login.html');
        }else{
          if(result.length==0){
            console.log("credentiale gresite");
            //pop-up credentiale gresite(to do)
          }else{
            console.log("credentiale acceptate");
            res.redirect('/home');
          }        
        }   
    });
    db.close();
  });
  //res.end();
});

app.get('/home', function(req, res){
  //are sesiune setata
  res.sendFile(__dirname + '\\public\\html\\home.html');
});

app.get('/inregistrare', function(req, res){
  res.sendFile(__dirname + '\\public\\html\\inregistrare.html');
  console.log('--------------------------');
  var urlVars = url.parse(req.url,true).query;
  urlVars=JSON.parse(JSON.stringify(urlVars)); //req.body = [Object: null prototype] -- elimina acest lucru.
  //console.log(myobj);
  //console.log(urlVars);
  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    var dbc = db.db("messenger");
    var myobj = { name: "Company Inc", address: "Highway 37" };
    dbc.collection("conturi").insertOne(urlVars, function(err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      db.close();
    });
  });
});



http.listen(80, () => {
  console.log('listening on *:80');
}); 
