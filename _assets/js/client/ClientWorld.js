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
	this.stateBuffer = [];
	this.stateMilliOffset = false;

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

	var self = this;

	//Not set offset yet and no buffer filled
	if(this.stateMilliOffset === false && this.stateBuffer.length < global.config.clientSideRenderBuffer){
		// ? 
		return;
	}

	//Buffer is filled enough. We need to set the offset from the first state in the buffer
	if(this.stateMilliOffset === false){
		this.stateMilliOffset = new Date().getTime() - this.stateBuffer[0].time;
	}

	//Find what we expect the server time to be.
	var expectedServerTime = new Date().getTime() - this.stateMilliOffset;

	//Find the two states that surround that time
	var justBelowIndex = false;
	var justAboveIndex = false;
	var justBelow = false;
	var justAbove = false;


	_.each(this.stateBuffer, function(el, ind){
		//If we are yet to find a state with a high enough time
		if(expectedServerTime < el.time && justAboveIndex === false){
			//Found the first one above expected time
			if(ind > 0){
				justBelowIndex = ind - 1;
				justBelow = self.stateBuffer[justBelowIndex];
				justBelow.deleteMe = false;
			}
			justAboveIndex = ind;
			justAbove = el;
		}else if(justAboveIndex === false){
			//Here we'll only see states pre expected server time
			//Keep the final two states, even if they are in the past
			if(ind < self.stateBuffer.length - 2){
				el.deleteMe = true;
			}
		}
	});

	//Delete any old ones
	for(var i = self.stateBuffer.length - 1; i >= 0; i--){
		var el = self.stateBuffer[i];
		if("deleteMe" in el && el.deleteMe){
			self.stateBuffer.splice(i, 1);
		} 
	}

	if(justAboveIndex !== false){
		if(justBelowIndex !== false){
			//We have an above state and a below state. Just interpolate between the two
			var timeDiff = justAbove.time - justBelow.time;
			var percentIn = (expectedServerTime - justBelow.time) / timeDiff;
			//For all values, find the difference, multiply by percentIn and add to below state

			this.worldState.setStateByInterpolation(justBelow, justAbove, percentIn, this.me.playerId);

		}else{
			//We have an above state but no below state - should never happen as we always keep two
			//Just set state as the above state?
			alert('Seem to have travelled into the past, which is weird');
		}
	}else{
		if(justBelowIndex !== false){
			//We have no above state, but do have a below state - should never happen as below is derived from above
			//Just set state to be below state
			alert('Seem to have a past but no future =/');
		}else{
			//We have neither
			if(this.stateBuffer.length >= 2){
				//There are no states in front of expected time, but there are states to use
				//Extrapolate out from the most recent two states
				justBelow = this.stateBuffer[this.stateBuffer.length-2];
				justAbove = this.stateBuffer[this.stateBuffer.length-1];
				var timeDiff = justAbove.time - justBelow.time;
				var percentPast = (expectedServerTime - justAbove.time) / timeDiff;
				
				this.worldState.setStateByExtrapolation(justBelow, 
														justAbove, 
														percentPast, this.me.playerId);

			}else if(this.stateBuffer.length == 1){
				//Just use this state
				this.worldState.setState(this.stateBuffer[0], this.me.playerId);
			}else{
				//There are no states - should never happen
				//Just don't change anything I suppose
			}
		}
	}



	//Render
	this.renderer.render();
}

ClientWorld.prototype.receivedServerState = function(payload){

	this.stateBuffer.push(payload);

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
				console.log('create player '+thisPlayer.playerId);
				player = new Player.Player(thisPlayer.playerId, this.physicsEngine, this.renderer);
				player.setState(thisPlayer);
				this.worldState.addPlayer(player);
			}/*else{
				player.setState(thisPlayer);
			}*/
		}
	}

	this.worldState.removePlayersNotIn(includedPlayers);
	
}

exports.ClientWorld = ClientWorld;