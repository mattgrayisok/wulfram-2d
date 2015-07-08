var events = require('events');
var ControllableTank = require('../shared/objects/ControllableTank');

/**
	Class representing the current player - not their tank
	Handle messages to and from the server here?
	This can also keep state of the currently logged in user maybe

*/
var Player = function(socket, world){

	var self = this;

	events.EventEmitter.call(this);

	this.socket = socket;
	this.world = world;
	this.physicsTickOffset = this.world.physicsTickCounter;

	this.currentControllable = false;

	if(global.isClient){
		this.initClient();
	}else{
		this.initServer();
	}


	global.pubsub.on('physicsTick', function(tick){
		if(self.currentControllable !== false){
			self.currentControllable.applyActionsForPhysicsTick(tick);
			var lastMove = self.currentControllable.getLatestInputState();
			console.log(lastMove);
			self.sendInputStateToServer(lastMove);
		}
	});

}

Player.prototype = Object.create(events.EventEmitter.prototype);

Player.prototype.initClient = function(){
	
	var self = this;

	this.socket.on('connected', function(msg){
		//The server has just told us that we're connected
		//msg contains an initial description of the world
		//Populate the world here
		//We'll start receiving world states from now on too
		console.log('Connected to server');
	});

	this.socket.on('disconnect', function(msg){
		//Connection broke. We can probably destroy the world 
		//and go back to some unconnected state

	});

	this.socket.on('message', function(msg){
		//Receved a message from the server
		var type = msg.type;
		switch (type){
			case 3:
				self.world.worldState.addReceivedState(msg.pl);
				break;
			case 4:
				self.addControllableToWorld(msg.pl);
				break;
			case 5:
				self.playerDied(msg.pl);
				break;
			default:
				break;
		}
	});
	
}

Player.prototype.requestWorldEntry = function(){
	console.log('Requesting world entry');
	this.socket.emit('message', {
		type: 4,
		pl: {
			entryPoint: '' //TODO: Fill with object id of entry point
		} 
	})
}

Player.prototype.addControllableToWorld = function(payload){
	//Create a controllable player
	//Initialise using info in payload
	//Add to world
	console.log('Received world add details');
	this.currentControllable = new ControllableTank(payload.entryPoint, payload.entryRotation, this.world, this);
	this.currentControllable.objectId = payload.objectId;
	this.currentControllable.addToWorld(this.world.physicsEngine.world);
	//this.world.worldState.addPlayer(this.currentControllable);

}

Player.prototype.sendInputStateToServer = function(inputState){
	var message = inputState.toMessage();
    message.physicsTickCounter = this.world.physicsTickCounter;
    console.log('Sending inputs for tick '+ message.physicsTickCounter);
    this.socket.emit('message', message);

}

Player.prototype.playerDied = function(){
	//Player has died
	//Update the controllable
	//Set timer to switch back to overview map

}

Player.prototype.initServer = function(){
	
	var self = this;

	this.socket.on('disconnect', function(msg){
		//User disconnected
		console.log('Detected player disconnect');
		//Remove player from the world if they're in it,
		//stop sending updates
		self.emit('disconnected');
	});

	this.socket.on('message', function(msg){
		//Message from client
		//Send inputs to their tank object

		var type = msg.type;
		switch (type){
			case 2:
				//Received input state for this player
				//Add to its controllable
				if(self.currentControllable == false){
					return;
				}

				self.currentControllable.addInputStateForPhysicsTick(msg.pl, msg.physicsTickCounter);
				
				break;
			case 4:
				//Request to add a controllable to the world
				//Check if it already has one
				if(self.currentControllable !== false){
					return;
				}

				//Check that the entry point exists
				//TODO
				
				//Find a location near the entry point that isn't inside another object
				var entryPoint = {x: Math.round((Math.random()*200)+100), y:Math.round((Math.random()*200)+100)};
				var entryRotation = Math.PI;

				//Create the player in the location
				self.currentControllable = new ControllableTank(entryPoint, entryRotation, self.world, self);
				self.currentControllable.addToWorld(self.world.physicsEngine.world);
				self.world.worldState.addPlayer(self.currentControllable);

				//Send back the details to the client

				self.socket.emit('message', {
					type: 4,
					pl: {
						entryPoint: entryPoint,
						entryRotation: entryRotation,
						objectId: self.currentControllable.objectId
					}
				});

				break;
			default:
				break;
		}

	});

	self.socket.emit('connected');

}

Player.prototype.remove = function(){
	if(global.isClient){
		//Shouldn't happen
		console.log('Player.remove() called on client');
	}else{
		//TODO: Remove from physics simulation
		//TODO: Remove from renderer
	}
}


module.exports = exports = Player;