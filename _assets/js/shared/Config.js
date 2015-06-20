var Config = function(){

	this.physicsClock_ms = 15;
	this.renderClock_ms = 25;
	this.serverEmitClock_ms = 100;
	
	this.inputToSimulationBuffer = 5; //A server side buffer for input events from the clients
	this.clientSideRenderBuffer = 2;
	this.serverAdjustmentReducer = 0.05;	//Used to slowly bring the player into the correct position rather than suddenly shift it
	this.minimumPositionAdjustmentOffset = 1;
	this.minimumAngleAdjustmentOffset = 0.1;

	this.shootingPastOffset = 10; // The number of physics ticks to go into the past when simulating shooting

	this.playerStartHealth = 100;
	this.playerVertices = [{ x: -25, y: -25 }, { x: 0, y: 25 }, { x: 25, y: -25 }];

	this.playerForwardThrust = 0.6;
	this.playerReverseThrust = 0.3;
	this.playerLateralThrust = 0.3;	//Strafe
	this.playerLateralTorque = 1.5;	//Rotate
	this.playerAtmosphericFriction = 0.02;
	this.playerRestitution = .1; //Energy conserved after collision
	this.playerDensity = 1;

	this.playerMainGunRange = 400;
	this.playerMainGunBackwardForce = 0.05;
	this.playerMainGunHitForce = 0.05;
	this.playerMainGunDamage = 1;
}

module.exports = exports = Config;