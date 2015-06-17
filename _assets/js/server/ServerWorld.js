var WorldState = require('../shared/WorldState');
var Player = require('../shared/Player');
var PhysicsClock = require('../shared/PhysicsClock');
var UpdateClock = require('./UpdateClock');
var _ = require('lodash');
var Matter = require('matter-js');

var ServerWorld = function(){

	this.worldState = new WorldState.WorldState();
	this.physicsTickCounter = 0;

	this.physicsEngine = Matter.Engine.create({enableSleeping: false, createRenderer: false});

	this.physicsEngine.world.gravity.x = 0;
	this.physicsEngine.world.gravity.y = 0;

	this.physicsClock = new PhysicsClock.PhysicsClock(this.physicsTick, this);
	this.updateClock = new UpdateClock.UpdateClock(this.updateTick, this);

	this.updateClock.start();
	this.physicsClock.start();

}

ServerWorld.prototype.addPlayer = function(socket){
	var player = new Player.Player(socket.playerId, this.physicsEngine, this.worldState, null, socket);
	this.worldState.addPlayer(player);
}

ServerWorld.prototype.removePlayer = function(socket){
	this.worldState.removePlayer(socket.playerId);
}

ServerWorld.prototype.handleInputMessage = function(playerId, payload){
	//console.log(playerId);
	var player = this.worldState.getPlayer(playerId);
	if(player){
		player.inputs.push(payload);
		if(!player.receivedFirstInput){
			player.receivedFirstInput = true;
			//This input is for the next physics tick + buffer amount
			var willBeApplied = this.physicsTickCounter + 1 + global.config.inputToSimulationBuffer;
			player.physicsTickCounterOffset = willBeApplied - payload.physicsTickCounter;
			//console.log("I'm on tick "+ this.physicsTickCounter +" Setting offset to "+player.physicsTickCounterOffset);
		}
	}

}

ServerWorld.prototype.physicsTick = function(){
	this.physicsTickCounter++;
	var self = this;

	_.forEach(this.worldState._state.players, function(player){
		player.server_applyStateForPhysicsTick(self.physicsTickCounter);
	});

	Matter.Engine.update(this.physicsEngine, global.config.physicsClock_ms);

}

ServerWorld.prototype.updateTick = function(){

	//Send out msgs
	var self = this;

	var snapShot = this.worldState.toMessage();
	snapShot.time = new Date().getTime();

    var message = {
    	type : 3,
    	pl : snapShot
    }

	//Send it to all players
    _.forEach(this.worldState._state.players, function(player){
    	if(!player.receivedFirstInput){
    		return;
    	}
		message.pl.physicsTick = self.physicsTickCounter - player.physicsTickCounterOffset;
    	message.pl.you = player.playerId;
    	player.socket.emit('message', message);
    });

}


exports.ServerWorld = ServerWorld;