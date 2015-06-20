var Matter 	= require('matter-js');
var _ 		= require('lodash');
var MoveableObject = require('./MoveableObject');


var Player = function(socket, position, angle, parentWorld){
	var self = this;

	this.base = MoveableObject;
	this.base(global.config.playerStartHealth, position, angle, global.config.playerVertices, 'players', parentWorld);

	this.physicsTickCounterOffset = 0;
	this.receivedFirstInput = false;
	this.previousInput = false;
	this.inputs = [];
	this.socket = socket;

	if(global.isClient){
		var texture = PIXI.Texture.fromImage("assets/images/tank.png");
		this.setTexture(texture);
	}

	if(this.socket !== false){
		this.socket.on('message', function(message){
			switch (message.type){
				case 2:
					//Input message
					self.addInputState(message.pl, self.parentWorld.physicsTickCounter);
					break;
				default:
					break;
			}

		});
	}

}

Player.prototype = Object.create(MoveableObject.prototype);
Player.prototype.objectType = 'player';

Player.prototype.addInputState = function(inputState, currentTick){
	this.inputs.push(inputState);
	if(!this.receivedFirstInput){
		this.receivedFirstInput = true;
		var willBeApplied = currentTick + 1 + global.config.inputToSimulationBuffer;
		this.physicsTickCounterOffset = willBeApplied - inputState.physicsTickCounter;
	}
}

Player.prototype.applyActionsForPhysicsTick = function(tick){
	this.applyInputStateForPhysicsTick(tick);
}

Player.prototype.applyInputStateForPhysicsTick = function(tick){

	//this.previousStates = []; //Clean this I think ?_?
	var selectedInput = false;

	for(var j = 0; j < this.inputs.length; j++){
		var thisInput = this.inputs[j];
		if(thisInput.physicsTickCounter < tick - this.physicsTickCounterOffset ){
			//This input is earlier than current phys tick - can be deleted
			thisInput.removeMe = true;
		}

		if(thisInput.physicsTickCounter == tick - this.physicsTickCounterOffset ){
			selectedInput = thisInput;
			thisInput.removeMe = true;
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


Player.prototype.applyInputState = function(state, tick){

	var self = this;

	if(state == false){
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


module.exports = exports = Player;
