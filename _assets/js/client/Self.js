
var Self = function(renderer, physicsEngine){

	this.inputs = [];
	this.renderer = renderer;
	this.physicsEngine = physicsEngine;

	//Create a physics body for the player
	this.body = Matter.Body.create( 
		{ 	frictionAir: global.config.playerAtmosphericFriction, 
			restitution: global.config.playerRestitution, 
			density: global.config.playerDensity,
			angle: Math.PI,
			vertices: [{ x: -25, y: -25 }, { x: 0, y: 25 }, { x: 25, y: -25 }],
			position: {x: 300, y: 300}
		});
	Matter.World.add(this.physicsEngine.world, this.body);

	console.log('inserted player into physics engine');

}

Self.prototype.applyInputState = function(state){

	this.inputs.push(state);

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
	}

	if(state.keys.right == 1){
		this.body.torque = global.config.playerLateralTorque;
	}

}

exports.Self = Self;