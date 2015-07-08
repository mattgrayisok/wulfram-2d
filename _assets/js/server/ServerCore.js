var UUID 			= require('node-uuid');
var ServerWorld 	= require('./ServerWorld');
var PlayerRepo 		= require('./PlayerRepo');
var Player 			= require('../shared/Player');

var ServerCore = function(io){

	this.io = io;

	this.serverWorld = new ServerWorld(this);
	this.playerRepo = new PlayerRepo(this.serverWorld);
	//TODO: Move update clock into player repo
}

ServerCore.prototype.init = function(){

	var self = this;
	var core = this;

	this.io.on('connection', function(socket){


		console.log('a user connected '+socket.id);

		//Create player
		//Player is responsible for receiving all further messages and proxying them appropriately
		var thisPlayer = new Player(socket, self.serverWorld);

		self.playerRepo.addPlayer(thisPlayer);
		
	});

}

module.exports = exports = ServerCore;