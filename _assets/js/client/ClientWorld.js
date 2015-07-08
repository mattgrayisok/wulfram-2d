var PhysicsClock 	= require('../shared/PhysicsClock');
var RenderClock 	= require('./RenderClock');
var InputState 		= require('../shared/InputState');
//var Player 			= require('../shared/objects/Player');
var WorldState 		= require('../shared/WorldState');
var Matter = require('matter-js/build/matter.js');

var ClientWorld = function(){

	this.physicsTickCounter = 0;
	this.worldState = new WorldState(this);

	this.physicsEngine = Matter.Engine.create({enableSleeping: false});

	this.physicsEngine.world.gravity.x = 0;
	this.physicsEngine.world.gravity.y = 0;

	this.physicsClock = new PhysicsClock(this.physicsTick, this);
	this.renderClock = new RenderClock(this.renderTick, this);

	/*this.me = new Player(socket, {x:300, y:300}, Math.PI, this);
	this.me.objectId = 0;
	this.me.addToWorld(this.physicsEngine.world);
	*/

	//this.renderClock.start();
	this.physicsClock.start();
	
}

ClientWorld.prototype.startRendering = function(){
	this.renderClock.start();
}

ClientWorld.prototype.stopRendering = function(){
	this.renderClock.stop();
}

ClientWorld.prototype.physicsTick = function(){
	this.physicsTickCounter++;


	//this.me.applyActionsForPhysicsTick();

    //Update physics for current user
    Matter.Engine.update(this.physicsEngine, global.config.physicsClock_ms);

	this.worldState.updateAllObjectsFromReceivedStates();

	global.pubsub.emit('physicsTick', this.physicsTickCounter);
    
}

ClientWorld.prototype.renderTick = function(){


	//Render
	global.renderer.render();
}

ClientWorld.prototype.receivedServerState = function(payload){

	this.worldState.addReceivedState(payload);
}

module.exports = exports = ClientWorld;