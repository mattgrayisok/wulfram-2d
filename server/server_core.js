global.window = global.document = global;

var server_core = module.exports = { },
    UUID        = require('node-uuid'),
    worldCode		= require('../shared/world');

//Create a world

var thisWorld = new World(true);

//Start ticking the world
thisWorld.update( new Date().getTime() );

server_core.addPlayer = function(socket){
	thisWorld.serverAddPlayer(socket);
};

server_core.handleMessage = function(socket, message){
	switch (message.type){
		case 2:
			//Input message
			thisWorld.serverAddInputToPlayer(socket.playerId, message.pl);
			break;
		default:
			break;
	}
};

server_core.removePlayer = function(socket){
	
};