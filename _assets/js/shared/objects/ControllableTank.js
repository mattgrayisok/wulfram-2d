var Matter = require('matter-js/build/matter.js');
var _ 		= require('lodash');
var Tank = require('./Tank');
var Keyboard = require("game-keyboard");
var keyMap = require("game-keyboard/key_map")["UK"];
var InputState = require('../InputState');


var ControllableTank = function(position, angle, parentWorld, player){
	var self = this;

	this.base = Tank;
	this.base(position, angle, parentWorld);
	this.player = player;

	this.physicsTickCounterOffset = 0;
	this.receivedFirstInput = false;
	this.previousInput = false;
	this.inputs = [];

	this.incorrectPositionX = 0;
	this.incorrectPositionY = 0;
	this.incorrectAngle = 0;

	this.keyboard = false;
	
}

ControllableTank.prototype = Object.create(Tank.prototype);
ControllableTank.prototype.objectType = 'controllable-player';

//Add input for physics tick 

ControllableTank.prototype.storeCurrentInputState = function(tick){
	//Get keyboard input state
	//var pressedKeys = KeyboardJS.activeKeys();
	if(this.keyboard == false){
		this.keyboard = new Keyboard(keyMap);
	}
	var keys = {
		up : 	this.keyboard.isPressed("up")?1:0,
		down : 	this.keyboard.isPressed("down")?1:0,
		left : 	this.keyboard.isPressed("left")?1:0,
		right : this.keyboard.isPressed("right")?1:0,
		w : 	this.keyboard.isPressed("w")?1:0,
		s : 	this.keyboard.isPressed("s")?1:0,
		a : 	this.keyboard.isPressed("a")?1:0,
		d : 	this.keyboard.isPressed("d")?1:0,
		sp: 	this.keyboard.isPressed("space")?1:0
	};

	var inputState = new InputState(keys, tick);
	//Store it as an input for this tick
	this.inputs.push(inputState);
	//Also return it so that it can be sent to the server
	return inputState;
}

ControllableTank.prototype.recordCurrentState = function(tick){
	var prevState = this.toMessage();
	prevState.physicsTick = tick-1;
	this.previousStates.push(prevState);
}

ControllableTank.prototype.applyInputStateForTick = function(tick){
	var selectedInput = false;

	for(var j = 0; j < this.inputs.length; j++){
		var thisInput = this.inputs[j];
		if(thisInput.physicsTickCounter < tick - this.physicsTickCounterOffset ){
			//This input is earlier than current phys tick - can be deleted
			thisInput.removeMe = true;
		}

		if(thisInput.physicsTickCounter == tick - this.physicsTickCounterOffset ){
			selectedInput = thisInput;
			//thisInput.removeMe = true;
			break;
		}
	}

	if(selectedInput === false){
		selectedInput = this.previousInput;
	}

	this.previousInput = selectedInput;

	for(var k = this.inputs.length - 1 ; k >= 0; k--){
		if(this.inputs[k].removeMe){
			this.inputs.splice(k, 1);
		}
	}

	this.applyInputState(selectedInput, tick);
}

ControllableTank.prototype.applyInputState = function(state, tick){
	var self = this;

	if(state == false || this.isDead){
		return;
	}

	if(state.keys.w == 1){
		Matter.Body.applyForce(this.body, this.body.position, 
			Matter.Vector.rotate({ x: 0, y: global.config.playerForwardThrust }, this.body.angle));
	}else if(state.keys.s == 1){
		Matter.Body.applyForce(this.body, this.body.position, 
			Matter.Vector.rotate({ x: 0, y: -global.config.playerReverseThrust }, this.body.angle));
	}

	if(state.keys.a == 1){
		Matter.Body.applyForce(this.body, this.body.position, 
			Matter.Vector.rotate({ x: global.config.playerLateralThrust, y: 0 }, this.body.angle));
	}else if(state.keys.d == 1){
		Matter.Body.applyForce(this.body, this.body.position, 
			Matter.Vector.rotate({ x: -global.config.playerLateralThrust, y: 0 }, this.body.angle));
	}

	if(state.keys.left == 1){
		this.body.torque = -global.config.playerLateralTorque;
	}else if(state.keys.right == 1){
		this.body.torque = global.config.playerLateralTorque;
	}

	if(state.keys.sp == 1){
		//Fire the guns
		//Raycast out and Check for collisions along the path
		
		if(global.isServer){

			var bodies = this.parentWorld.worldState.getAllShootableBodiesForTick(
				tick - global.config.inputToSimulationBuffer - global.config.shootingPastOffset, 
				this.objectId);

			var xDelta = Math.sin(this.body.angle) * global.config.playerMainGunRange * -1; //Not sure why this needs a -1
			var yDelta = Math.cos(this.body.angle) * global.config.playerMainGunRange;
			var rayVector = {x:xDelta, y:yDelta};
			var collisions = Matter.Query.ray (bodies, 
								this.body.position, 
								Matter.Vector.add(this.body.position, rayVector));

			var hit = false;
			var collisionToUse = false;
			var collisionDistance = 9999;
			_.each(collisions, function(collision, index){
				
				var differenceVector = Matter.Vector.sub(collision.body.position, self.body.position);
				var distance = Matter.Vector.magnitudeSquared(differenceVector);
				if(collisionToUse == false || distance < collisionDistance){
					collisionToUse = collision;
					collisionDistance = distance;
				}

			});

			if(collisionToUse!==false){
				
				var body = collisionToUse.body;
				var otherObject = body.parentObject;
				Matter.Body.applyForce(otherObject.body, self.body.position, 
					Matter.Vector.rotate({ x: 0, y: global.config.playerMainGunHitForce }, self.body.angle));
		
				//Reduce health on other player
				otherObject.reduceHealth(global.config.playerMainGunDamage);
			};

		}
		
		//Reduce energy on this player
		//Apply a small force to this player pushing them backwards
		Matter.Body.applyForce(this.body, this.body.position, 
			Matter.Vector.rotate({ x: 0, y: -global.config.playerMainGunBackwardForce }, this.body.angle));

		//Update sprite to reflect firing
	}

	this.updateSpriteFromBody();
}

//Server only
ControllableTank.prototype.addInputStateForPhysicsTick = function(inputState, tick){
	this.inputs.push(inputState);
	if(!this.receivedFirstInput){
		this.receivedFirstInput = true;
		var willBeApplied = this.parentWorld.physicsTickCounter + 1 + global.config.inputToSimulationBuffer;
		this.physicsTickCounterOffset = willBeApplied - inputState.physicsTickCounter;
	}
}

ControllableTank.prototype.applyActionsForPhysicsTick = function(tick){
	
	//Apply input state for this tick if we're on client
	if(global.isClient){
		this.recordCurrentState(tick);
		this.storeCurrentInputState(tick);
	}

	this.applyInputStateForTick(tick);

	if(global.isClient){
		this.reconcileTowardsAdjustment();
	}
}

ControllableTank.prototype.getLatestInputState = function(){
	console.log(this.inputs);
	return this.inputs[this.inputs.length-1];
}

ControllableTank.prototype.adjustForHistoryState = function(serverTick, playerState, currentTick){

	//console.log("I'm on "+currentTick+" received state for "+state.physicsTick);

	for(var i = 0 ; i < this.previousStates.length; i++){
		var prevState = this.previousStates[i];
		if(prevState.physicsTick < serverTick){
			prevState.removeMe = true;
		}else if(prevState.physicsTick == serverTick){
			//console.log('Found a state for this tick');
			prevState.removeMe = true;
			//Check we WERE in the right place

			var xDelta = prevState.position.x - playerState.position.x;
			var yDelta = prevState.position.y - playerState.position.y;
			var angleDelta = prevState.angle - playerState.angle;

			if(Math.abs(xDelta) > global.config.minimumPositionAdjustmentOffset || Math.abs(yDelta) > global.config.minimumPositionAdjustmentOffset || Math.abs(angleDelta) > global.config.minimumAngleAdjustmentOffset){

				this.incorrectPositionX = xDelta;
				this.incorrectPositionY = yDelta;
				this.incorrectAngle = angleDelta;

			}

		}
	}

	for(var k = this.previousStates.length - 1 ; k >= 0; k--){
		if(this.previousStates[k].removeMe){
			this.previousStates.splice(k, 1);
		}
	}

}

ControllableTank.prototype.reconcileTowardsAdjustment = function(){
	if(Math.abs(this.incorrectPositionX) > global.config.minimumPositionAdjustmentOffset 
		|| Math.abs(this.incorrectPositionY) > global.config.minimumPositionAdjustmentOffset 
		|| Math.abs(this.incorrectAngle) > global.config.minimumAngleAdjustmentOffset){

		var changeX = this.incorrectPositionX*global.config.serverAdjustmentReducer;
		var changeY = this.incorrectPositionY*global.config.serverAdjustmentReducer;
		var changeAngle = this.incorrectAngle*global.config.serverAdjustmentReducer;

		var newPos = Matter.Vector.sub(this.body.position, {x: changeX, y:changeY});
		var newAngle = this.body.angle - changeAngle;

		Matter.Body.set(this.body, 'position', newPos);
		Matter.Body.set(this.body, 'angle', newAngle);

		this.incorrectPositionX -= changeX;
		this.incorrectPositionY -= changeY;
		this.incorrectAngle -= changeAngle;
	}
}

module.exports = exports = ControllableTank;
