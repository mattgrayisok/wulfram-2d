var Matter = require('matter-js/build/matter.js');
var _ 		= require('lodash');
var UUID 	= require('node-uuid');
var events = require('events');

var WorldObject = function(position, angle, vertices, isStatic, renderLayer, parentWorld){
	
	events.EventEmitter.call(this);

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
		//FIXME: figure out the best way to handle this
		//global.renderer[this.renderLayer].addChild(this.sprite);
	}

}

WorldObject.prototype = Object.create(events.EventEmitter.prototype);
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
	//console.log('Interpolating', global.helpers.interpolateVector(state1.position, state2.position, percent));
	this.updateSpriteFromBody();
}

WorldObject.prototype.setStateByExtrapolation = function(state1, state2, percent){
	Matter.Body.set(this.body, 'position', global.helpers.extrapolateVector(state1.position, state2.position, percent));
	Matter.Body.set(this.body, 'angle', global.helpers.extrapolate(state1.angle, state2.angle, percent));
	//console.log('Extrapolating', global.helpers.interpolateVector(state1.position, state2.position, percent));
	this.updateSpriteFromBody();
}

WorldObject.prototype.toMessage = function(){
	return {
		objectId : this.objectId,
		position: {x:this.body.position.x, y:this.body.position.y},
		angle: this.body.angle,
	};
}

WorldObject.prototype.applyActionsForPhysicsTick = function(tick){
	return;
}

WorldObject.prototype.remove = function(){
	//Remove from physics
	Matter.World.remove(this.parentWorld.physicsEngine.world, this.body);
	//Remove from renderer
	if(global.isClient){
	    global.renderer[this.renderLayer].removeChild(this.sprite);
	}
}

module.exports = exports = WorldObject;
