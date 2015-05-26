var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Player = require("./player").Player;


function init() {
	
	initialiseStateObjects();
	
	intialiseSocketListeners();

	initialiseGameLoop();

};

function initialiseStateObjects(){
	var gameState = {
		x: 50,
		y: 50
	}

    var players = [];

    player = new Player(100, 100);
}

function intialiseSocketListeners(){
	app.get('/', function(req, res){
	  res.sendFile(__dirname + '/index.html');
	});

	io.on('connection', function(socket){
	  console.log('a user connected '+socket.id);
	 
	  socket.on('disconnect', function(){
	    
	    //User disconnected - remove from world

	  });

	  socket.on('game.event.clientStatus', function(status){
	    
	  	//Update the keypress status of the player
	  	player.upPressed = status.upPressed;
	  	player.downPressed = status.downPressed;
	  	player.leftPressed = status.leftPressed;
	  	player.rightPressed = status.rightPressed;


	  });

	});

	http.listen(3000, function(){
	  console.log('listening on *:3000');
	});
}

function initialiseGameLoop(){
	setInterval(gameLoop, 500);
}

function gameLoop(){
	//console.log('gameLoop');
	if(player.upPressed){
		player.setY(player.getY-1);
	}else if(player.downPressed){
		player.setY(player.getY+1);
	}
	if(player.leftPressed){
		player.setX(player.getX-1);
	}else if(player.rightPressed){
		player.setX(player.getX+1);
	}

	io.emit('game.event.serverStatus', player);

}


init();