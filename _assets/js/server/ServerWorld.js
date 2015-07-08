var WorldState = require('../shared/WorldState');
var ControllableTank = require('../shared/objects/ControllableTank');
var PhysicsClock = require('../shared/PhysicsClock');
var _ = require('lodash');
var Matter = require('matter-js/build/matter.js');
var Tank = require('../shared/objects/Tank');

var ServerWorld = function(){

	this.worldState = new WorldState();
	this.physicsTickCounter = 0;

	this.physicsEngine = Matter.Engine.create({enableSleeping: false});

	this.physicsEngine.world.gravity.x = 0;
	this.physicsEngine.world.gravity.y = 0;

	this.physicsClock = new PhysicsClock(this.physicsTick, this);

	this.physicsClock.start();

	this.tempPlayer = new Tank({x:400, y:400}, Math.PI, this);
	this.tempPlayer.addToWorld(this.physicsEngine.world);
	this.worldState.addPlayer(this.tempPlayer);

}

/*ServerWorld.prototype.addPlayer = function(socket){
	var player = new ControllablePlayer(socket, {x:300, y:300}, Math.PI, this);
	this.worldState.addPlayer(player);
	player.addToWorld(this.physicsEngine.world);
}*/

/*ServerWorld.prototype.removePlayer = function(socket){
	this.worldState.removePlayer(socket.objectId);
}*/

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


module.exports = exports = ServerWorld;