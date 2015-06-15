var PhysicsClock 	= require('../shared/PhysicsClock');
var RenderClock 	= require('./RenderClock');
var InputState 		= require('../shared/InputState');
var Player 			= require('../shared/Player');
var WorldState 		= require('../shared/WorldState');


var ClientWorld = function(renderer, socket){

	this.renderer = renderer;
	this.socket = socket;
	this.physicsTickCounter = 0;

	this.worldState = new WorldState.WorldState();

	this.physicsEngine = Matter.Engine.create(document.getElementById('test'), {
		enableSleeping: false,
	  	render: {
			controller: Matter.RenderPixi,
			options: {
				wireframes: true,
				showAngleIndicator: true
			}
		}
	}, false);

	this.physicsEngine.world.gravity.x = 0;
	this.physicsEngine.world.gravity.y = 0;

	this.physicsClock = new PhysicsClock.PhysicsClock(this.physicsTick, this);
	this.renderClock = new RenderClock.RenderClock(this.renderTick, this);

	this.inputHistory = [];

	this.me = new Player.Player(0, this.physicsEngine, renderer);

	this.renderClock.start();
	this.physicsClock.start();
	
}

ClientWorld.prototype.physicsTick = function(){
	this.physicsTickCounter++;

	//TODO: Get keyboard state
	var pressedKeys = KeyboardJS.activeKeys();
	var keys = {
		up : 	_.includes(pressedKeys, "up")?1:0,
		down : 	_.includes(pressedKeys, "down")?1:0,
		left : 	_.includes(pressedKeys, "left")?1:0,
		right : _.includes(pressedKeys, "right")?1:0,
		w : 	_.includes(pressedKeys, "w")?1:0,
		s : 	_.includes(pressedKeys, "s")?1:0,
		a : 	_.includes(pressedKeys, "a")?1:0,
		d : 	_.includes(pressedKeys, "d")?1:0,
		sp: 	_.includes(pressedKeys, "space")?1:0
	};

	var inputState = new InputState.InputState(keys, this.physicsTickCounter);
	this.me.inputs.push(inputState);
	this.me.applyInputState(inputState, this.physicsTickCounter);

    //Update physics for current user
    //this.me.x+=1 ;
    Matter.Engine.update(this.physicsEngine, global.config.physicsClock_ms);
    //Matter.Engine.render(this.physicsEngine);
    
    //Send keyboard state to server
    var message = inputState.toMessage();
    message.physicsTickCounter = this.physicsTickCounter;
    //console.log('Sending inputs for tick '+ message.physicsTickCounter);
    this.socket.emit('message', message);

}

ClientWorld.prototype.renderTick = function(){
	this.renderer.render();
}

ClientWorld.prototype.receivedServerState = function(payload){

	if(this.me.playerId == 0){
		this.me.playerId = payload.you;
	}

	var includedPlayers = [];

	for(var index in payload.players){
		var thisPlayer = payload.players[index];
		includedPlayers.push(thisPlayer.playerId);
		if(thisPlayer.playerId == this.me.playerId){
			if(payload.physicsTick >= 0){
				this.me.client_updateFromServer(payload, thisPlayer, this.physicsTickCounter);
			}
		}else{
			var player = this.worldState.getPlayer(thisPlayer.playerId);
			if(typeof player == 'undefined'){
				console.log('create player');
				player = new Player.Player(thisPlayer.playerId, this.physicsEngine, this.renderer);
				player.setState(thisPlayer);
				this.worldState.addPlayer(player);
			}else{
				player.setState(thisPlayer);
			}
		}
	}

	this.worldState.removePlayersNotIn(includedPlayers);

}

exports.ClientWorld = ClientWorld;