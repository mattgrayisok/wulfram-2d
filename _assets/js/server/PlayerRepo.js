var UpdateClock = require('./UpdateClock');
var _ = require('lodash');

var PlayerRepo = function(world){

	this.players = [];
	this.world = world;
	this.updateClock = new UpdateClock(this.updateTick, this);

	this.updateClock.start();

}

PlayerRepo.prototype.addPlayer = function(player){

	var self = this;

	player.on('disconnected', function(){
		self.removePlayer(player);
	});

	this.players.push(player);

}

PlayerRepo.prototype.removePlayer = function(player){
	//We want to remove this player from the server
	player.remove();
	this.players = _.without(this.players, player);
}


PlayerRepo.prototype.updateTick = function(){

	//Send out msgs
	var self = this;

	var snapShot = this.world.worldState.toMessage();
	snapShot.time = new Date().getTime();


    var message = {
    	type : 3,
    	pl : snapShot
    }

	//Send it to all players
	//var players = this.world.worldState.getAllPlayers();


    _.forEach(this.players, function(player){
    	message.pl.physicsTick = self.world.physicsTickCounter - player.physicsTickOffset;
    	//message.pl.you = player.objectId;
    	player.socket.emit('message', message);
    });

}

module.exports = exports = PlayerRepo;