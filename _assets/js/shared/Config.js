var Config = function(){

	this.physicsClock_ms = 15;
	this.renderClock_ms = 25;
	this.serverEmitClock_ms = 100;
	
	this.inputToSimulationBuffer = 5; //A server side buffer for input events from the clients
	this.clientSideRenderBuffer = 2;
	this.serverAdjustmentReducer = 0.1;	//Used to slowly bring the player into the correct position rather than suddenly shift it
	this.minimumPositionAdjustmentOffset = 1;
	this.minimumAngleAdjustmentOffset = 0.1;

	this.playerForwardThrust = 0.6;
	this.playerReverseThrust = 0.3;
	this.playerLateralThrust = 0.3;	//Strafe
	this.playerLateralTorque = 1.5;	//Rotate
	this.playerAtmosphericFriction = 0.02;
	this.playerRestitution = .1; //Energy conserved after collision
	this.playerDensity = 1;
}

exports.Config = Config;