var UUID 			= require('node-uuid');
var ServerWorld 	= require('./ServerWorld');

var ServerCore = function(io){

	this.socket = false;
	this.io = io;
	this.serverWorld = false;

}

ServerCore.prototype.init = function(){

	this.serverWorld = new ServerWorld();

	var core = this;

	this.io.on('connection', function(socket){


		console.log('a user connected '+socket.id);
		
		socket.emit('connected');

		core.serverWorld.addPlayer(socket);

		/*socket.on('disconnect', function(){
			//User disconnected - remove from world
			core.serverWorld.removePlayer(socket);
		});*/
		
	});

}

module.exports = exports = ServerCore;