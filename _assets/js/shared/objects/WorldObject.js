var Matter 	= require('matter-js');
var _ 		= require('lodash');
var UUID 	= require('node-uuid');

var WorldObject = function(position, angle, vertices, isStatic, renderLayer, parentWorld){
	this.objectId = UUID();

	this.vertices = vertices || [{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}];
	this.startPosition = position || {x:0, y:0};
	this.isStatic = typeof isStatic == 'undefined' ? true : isStatic; 
	this.renderLayer = renderLayer || 'players';
	this.angle = angle || 0;
	this.parentWorld = parentWorld;

	this.incorrectPositionX = 0;
	this.incorrectPositionY = 0;
	this.incorrectAngle = 0;

	this.previousStates = [];

	this.body = Matter.Body.create({ 	
		frictionAir: global.config.playerAtmosphericFriction, 
		restitution: global.config.playerRestitution, 
		density: global.config.playerDensity,
		angle: this.angle,
		vertices: this.vertices,
		position: this.startPosition,
		isStatic: this.isStatic
	});

	this.body.parentObject = this;

	this.sprite = false;

	if(global.isClient){
		var texture = PIXI.Texture.fromImage("assets/images/tank.png");
		this.sprite = new PIXI.Sprite(texture);
		this.sprite.anchor.x = 0.5;
		this.sprite.anchor.y = 0.5;

		// move the sprite to the center of the screen
		this.updateSpriteFromBody();
		global.renderer[this.renderLayer].addChild(this.sprite);
	}

}

WorldObject.prototype.objectType = 'generic';

WorldObject.prototype.addToWorld = function(world){
	Matter.World.add(world, this.body);
}

WorldObject.prototype.setTexture = function(texture){
	if(global.isServer || this.sprite === false){
		return;
	}

	this.sprite.texture = texture;
	
	
}

WorldObject.prototype.updateSpriteFromBody = function(){
	if(global.isServer){
		return;
	}

	this.sprite.position.x = this.body.position.x;
    this.sprite.position.y = this.body.position.y;
    this.sprite.rotation = this.body.angle;
}

//TODO: Could probably move these into movebable

WorldObject.prototype.setState = function(state){
	Matter.Body.set(this.body, 'position', state.position);
	Matter.Body.set(this.body, 'angle', state.angle);
	this.updateSpriteFromBody();
}

WorldObject.prototype.setStateByInterpolation = function(state1, state2, percent){
	Matter.Body.set(this.body, 'position', global.helpers.interpolateVector(state1.position, state2.position, percent));
	Matter.Body.set(this.body, 'angle', global.helpers.interpolate(state1.angle, state2.angle, percent));
	this.updateSpriteFromBody();
}

WorldObject.prototype.setStateByExtrapolation = function(state1, state2, percent){
	Matter.Body.set(this.body, 'position', global.helpers.extrapolateVector(state1.position, state2.position, percent));
	Matter.Body.set(this.body, 'angle', global.helpers.extrapolate(state1.angle, state2.angle, percent));
	this.updateSpriteFromBody();
}

WorldObject.prototype.recordCurrentState = function(tick){
	var prevState = this.toMessage();
	prevState.physicsTick = tick-1;
	this.previousStates.push(prevState);
}

WorldObject.prototype.updateFromServer = function(state, playerState, currentTick){

	//Check if we're in the correct position given the current tick state

	var serverTick = state.physicsTick;

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
				//console.log('adjusting by '+xDelta);
				//Need to adjust current position
				//var newPos = Matter.Vector.sub(this.body.position, {x:xDelta*global.config.serverAdjustmentReducer, y:yDelta*global.config.serverAdjustmentReducer});
				//var newAngle = this.body.angle + angleDelta*global.config.serverAdjustmentReducer;

				//Matter.Body.set(this.body, 'position', newPos);
				//Matter.Body.set(this.body, 'angle', playerState.angle);

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

WorldObject.prototype.toMessage = function(){
	return {
		objectId : this.objectId,
		position: {x:this.body.position.x, y:this.body.position.y},
		angle: this.body.angle,
	};
}

WorldObject.prototype.reconcileTowardsServer = function(){

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

WorldObject.prototype.applyActionsForPhysicsTick = function(tick){
	
	
	return;
}

WorldObject.prototype.remove = function(){
	
	Matter.World.remove(this.parentWorld.physicsEngine.world, this.body);
	if(global.isClient){
	    global.renderer[this.renderLayer].removeChild(this.sprite);
	}
}

module.exports = exports = WorldObject;
