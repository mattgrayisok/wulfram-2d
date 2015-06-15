var UUID 			= require('node-uuid');
var ServerWorld 	= require('./ServerWorld');

var ServerCore = function(io){

	this.socket = false;
	this.io = io;
	this.serverWorld = false;

}

ServerCore.prototype.init = function(){

	this.serverWorld = new ServerWorld.ServerWorld();

	var core = this;

	this.io.on('connection', function(socket){


		console.log('a user connected '+socket.id);
		
		socket.playerId = UUID();
		socket.emit('connected', {playerId : socket.playerId});

		core.serverWorld.addPlayer(socket);

		socket.on('disconnect', function(){
			//User disconnected - remove from world
			core.serverWorld.removePlayer(socket);
		});
		socket.on('message', function(message){
			//Handle all messages
			
			switch (message.type){
				case 2:
					//Input message
					core.serverWorld.handleInputMessage(socket.playerId, message.pl);
					break;
				default:
					break;
			}

		});
	});

}

exports.ServerCore = ServerCore;