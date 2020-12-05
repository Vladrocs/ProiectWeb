const express = require('express');
var app = express();
const url = require('url');
const fs = require('fs');//to acces file from fs
var http = require('http').createServer(app);
const mongo = require("mongodb");
var MongoClient = mongo.MongoClient;

const uri ="mongodb://localhost:27017/";
//const client = new MongoClient(uri);
const client = new MongoClient(uri);


app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '\\public\\html\\login.html');
});

app.get('/inregistrare.html', function(req, res){
  res.sendFile(__dirname + '\\public\\html\\inregistrare.html');
  console.log('--------------------------');
  var urlVars = url.parse(req.url,true).query;
  //urlVars=JSON.parse(JSON.stringify(urlVars)); //req.body = [Object: null prototype] -- elimina acest lucru.
  //console.log(myobj);
  //console.log(urlVars);
    MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    var dbc = db.db("messenger");
    var myobj = { name: "Company Inc", address: "Highway 37" };
    dbc.collection("conturi").insertOne(myobj, function(err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      db.close();
    });
  });


});









http.listen(80, () => {
  console.log('listening on *:80');
}); 
