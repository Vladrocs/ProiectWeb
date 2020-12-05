var app = require('express')();
var express = require('express');
var fs = require('fs');//to acces file from fs
var http = require('http').createServer(app);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    console.log("--------------------------------------------------------------------");
  res.sendFile(__dirname + '\\public\\html\\login.html');
});

app.get('/inregistrare.html', function(req, res){
    console.log("--------------------------------------------------------------------");
  res.sendFile(__dirname + '\\public\\html\\inregistrare.html');
});

http.listen(80, () => {
  console.log('listening on *:80');
}); 
