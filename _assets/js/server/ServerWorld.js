var WorldState = require('../shared/WorldState');
var Player = require('../shared/objects/Player');
var PhysicsClock = require('../shared/PhysicsClock');
var UpdateClock = require('./UpdateClock');
var _ = require('lodash');
var Matter = require('matter-js');

var ServerWorld = function(){

	this.worldState = new WorldState();
	this.physicsTickCounter = 0;

	this.physicsEngine = Matter.Engine.create({enableSleeping: false, useRenderer: false});

	this.physicsEngine.world.gravity.x = 0;
	this.physicsEngine.world.gravity.y = 0;

	this.physicsClock = new PhysicsClock(this.physicsTick, this);
	this.updateClock = new UpdateClock(this.updateTick, this);

	this.updateClock.start();
	this.physicsClock.start();

}

ServerWorld.prototype.addPlayer = function(socket){
	var player = new Player(socket, {x:300, y:300}, Math.PI, this);
	this.worldState.addPlayer(player);
	player.addToWorld(this.physicsEngine.world);
}

ServerWorld.prototype.removePlayer = function(socket){
	this.worldState.removePlayer(socket.objectId);
}

ServerWorld.prototype.physicsTick = function(){
	this.physicsTickCounter++;
	var self = this;

	var objects = this.worldState.getAllObjects();

	_.forEach(objects, function(object){
		object.applyActionsForPhysicsTick(self.physicsTickCounter);
	});

	this.worldState.recordObjectStatesForPhysicsTick(self.physicsTickCounter);

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
	var players = this.worldState.getAllPlayers();

    _.forEach(players, function(player){
    	if(!player.receivedFirstInput){
    		return;
    	}
		message.pl.physicsTick = self.physicsTickCounter - player.physicsTickCounterOffset;
    	message.pl.you = player.objectId;
    	player.socket.emit('message', message);
    });

}


module.exports = exports = ServerWorld;