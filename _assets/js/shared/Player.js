
var Matter = require('matter-js');

var Player = function(playerId, physicsEngine, worldState, renderer, socket){

	this.playerId = playerId;
	this.inputs = [];
	this.previousStates = [];
	this.receivedFirstInput = false;
	this.previousInput = false;
	this.physicsTickCounterOffset = 0;
	this.renderer = renderer;
	this.physicsEngine = physicsEngine;
	this.socket = socket;
	this.worldState = worldState;
	this.health = 100;

	//Create a physics body for the player
	this.body = Matter.Body.create( 
		{ 	frictionAir: global.config.playerAtmosphericFriction, 
			restitution: global.config.playerRestitution, 
			density: global.config.playerDensity,
			angle: Math.PI,
			vertices: [{ x: -25, y: -25 }, { x: 0, y: 25 }, { x: 25, y: -25 }],
			position: {x: 300, y: 300}
		});
	this.body.parentPlayer = this;
	Matter.World.add(this.physicsEngine.world, this.body);

	if(this.renderer !== null){
		//Create a rendering object
		var texture = PIXI.Texture.fromImage("assets/images/tank.png");
		this.sprite = new PIXI.Sprite(texture);
	    this.sprite.anchor.x = 0.5;
	    this.sprite.anchor.y = 0.5;
	 
	    // move the sprite t the center of the screen
	    this.updateSpriteFromBody();
	 
	    this.renderer.players.addChild(this.sprite);
	}
}

Player.prototype.server_applyStateForPhysicsTick = function(tick){

	this.previousStates = [];

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

	if(state == false){
		return;
	}
	
	//this.inputs.push(state);

	var prevState = this.toMessage();
	prevState.physicsTick = tick-1;
	this.previousStates.push(prevState);
	//console.log('Adding prev state for tick '+prevState.physicsTick+' Pos '+prevState.position.x);

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
		//TODO: This needs to compare against a previous state. How the dickens to achieve that?
		var xDelta = Math.sin(this.body.angle) * global.config.playerMainGunRange * -1; //Not sure why this needs a -1
		var yDelta = Math.cos(this.body.angle) * global.config.playerMainGunRange;
		var rayVector = {x:xDelta, y:yDelta};
		var collisions = Matter.Query.ray (this.worldState.getAllPlayerBodies(this.playerId), 
							this.body.position, 
							Matter.Vector.add(this.body.position, rayVector));

		if(collisions.length > 0){
			
		} 
		
		//Reduce health on other player
		//Reduce energy on this player
		//Apply a small force to the other player where they were shot
		//Apply a small force to this player pushing them backwards
		//Update sprite to reflect firing
	}


	if(this.renderer !== null){
		this.updateSpriteFromBody();
	}

}

Player.prototype.client_updateFromServer = function(state, playerState, currentTick){

	//Check if we're in the correct position given the current tick state

	var serverTick = state.physicsTick;

	//console.log("I'm on "+currentTick+" received state for "+state.physicsTick);

	for(var i = 0 ; i < this.previousStates.length; i++){
		var prevState = this.previousStates[i];
		if(prevState.physicsTick < serverTick){
			prevState.removeMe = true;
		}else if(prevState.physicsTick == serverTick){
			prevState.removeMe = true;
			//Check we WERE in the right place

			var xDelta = prevState.position.x - playerState.position.x;
			var yDelta = prevState.position.y - playerState.position.y;
			var angleDelta = prevState.angle - playerState.angle;

			if(Math.abs(xDelta) > global.config.minimumPositionAdjustmentOffset || Math.abs(yDelta) > global.config.minimumPositionAdjustmentOffset || Math.abs(angleDelta) > global.config.minimumAngleAdjustmentOffset){
				//console.log('adjusting by '+xDelta);
				//Need to adjust current position
				var newPos = Matter.Vector.sub(this.body.position, {x:xDelta*global.config.serverAdjustmentReducer, y:yDelta*global.config.serverAdjustmentReducer});
				var newAngle = this.body.angle + angleDelta*global.config.serverAdjustmentReducer;

				Matter.Body.set(this.body, 'position', newPos);
				Matter.Body.set(this.body, 'angle', playerState.angle);

			}

		}
	}

	for(var k = this.previousStates.length - 1 ; k >= 0; k--){
		if(this.previousStates[k].removeMe){
			this.previousStates.splice(k, 1);
		}
	}

}

Player.prototype.updateSpriteFromBody = function(){
	this.sprite.position.x = this.body.position.x;
    this.sprite.position.y = this.body.position.y;
    this.sprite.rotation = this.body.angle;
}

Player.prototype.setState = function(state){
	
	Matter.Body.set(this.body, 'position', state.position);
	Matter.Body.set(this.body, 'angle', state.angle);

	if(this.renderer !== null){
		this.updateSpriteFromBody();
	}
}

Player.prototype.setStateByInterpolation = function(state1, state2, percent){
	
	Matter.Body.set(this.body, 'position', global.helpers.interpolateVector(state1.position, state2.position, percent));
	Matter.Body.set(this.body, 'angle', global.helpers.interpolate(state1.angle, state2.angle, percent));

	if(this.renderer !== null){
		this.updateSpriteFromBody();
	}
}

Player.prototype.setStateByExtrapolation = function(state1, state2, percent){
	
	Matter.Body.set(this.body, 'position', global.helpers.extrapolateVector(state1.position, state2.position, percent));
	Matter.Body.set(this.body, 'angle', global.helpers.extrapolate(state1.angle, state2.angle, percent));

	if(this.renderer !== null){
		this.updateSpriteFromBody();
	}
}

Player.prototype.toMessage = function(){
	return {
		playerId : this.playerId,
		position: {x:this.body.position.x, y:this.body.position.y},
		angle: this.body.angle,
	};
}

Player.prototype.remove = function(){
	Matter.World.remove(this.physicsEngine.world, this.body);
	if(this.renderer !== null){
	    this.renderer.players.removeChild(this.sprite);
	}
}

exports.Player = Player;