var app 		= require('express')();
var http 		= require('http').Server(app);
var io 			= require('socket.io')(http);
var UUID 		= require('node-uuid');
var serverCore 	= require('./server/server_core');

function init() {
	
	intialiseSocketListeners();

};

function intialiseSocketListeners(){
	app.get('/', function(req, res){
	  res.sendFile(__dirname + '/index.html');
	});

	app.get( '/*' , function( req, res, next ) {
        //This is the current file they have requested
        var file = req.params[0];
        //Send the requesting client the file.
        res.sendFile( __dirname + '/' + file );
    });

	io.on('connection', function(socket){
	  console.log('a user connected '+socket.id);
	  socket.playerId = UUID();
	  socket.emit('connected', {playerId : socket.playerId});

	  serverCore.addPlayer(socket);

	  socket.on('disconnect', function(){
	    //User disconnected - remove from world
	    serverCore.removePlayer(socket);
	  });
	  socket.on('message', function(message){
	    //Handle all messages
	    serverCore.handleMessage(socket, message);
	  });
	});

	http.listen(3000, function(){
	  console.log('listening on *:3000');
	});
}

init();