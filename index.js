var app = require('express')();
var express = require('express');
const url = require('url');
var fs = require('fs');//to acces file from fs
var http = require('http').createServer(app);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '\\public\\html\\login.html');
});

app.get('/inregistrare.html', function(req, res){
  res.sendFile(__dirname + '\\public\\html\\inregistrare.html');
  console.log('--------------------------');
  const urlVars = url.parse(req.url,true).query;
  //console.log(urlVars);    datele din formul de inregistrare.
});







http.listen(80, () => {
  console.log('listening on *:80');
}); 
