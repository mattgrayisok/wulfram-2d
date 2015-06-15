

var frame_time = 60/1000; // run the local game at 16ms/ 60hz
if('undefined' != typeof(global)) frame_time = 45; //on server we run at 45ms, 22hz

( function () {
    var lastTime = 0;
    var vendors = [ 'ms', 'moz', 'webkit', 'o' ];
    for ( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++ x ) {
        window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
        window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ] || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
    }
    if ( !window.requestAnimationFrame ) {
        window.requestAnimationFrame = function ( callback, element ) {
            var currTime = Date.now(), timeToCall = Math.max( 0, frame_time - ( currTime - lastTime ) );
            var id = window.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if ( !window.cancelAnimationFrame ) {
        window.cancelAnimationFrame = function ( id ) { clearTimeout( id ); };
    }
}());



/******************
* Player
******************/

var Player = function(socket, renderLayer){

	this.socket = socket;
	this.playerId = socket.playerId;
	this.inputs = [];
	this.latestInputApplied = -1;
	this.tickCounterOffset = -1;
	this.receivedFirstInput = false;
	this.previousInput = false;
	this.renderLayer = (renderLayer||false);

	this.x = 0;
	this.y = 0;

	if(this.renderLayer !== false){
		//Create a sprite, copy over state, add it to layer
		this.mySprite = new PIXI.Sprite(PIXI.Texture.fromImage('_assets/bunny.png'));
		this.copyStateToSprite();
		this.renderLayer.addChild(this.mySprite);
	}

}

Player.prototype.addInput = function(inputState){
	this.inputs.push(inputState);
}

Player.prototype.getState = function(){
	return {
		id: this.playerId,
		x: this.x,
		y: this.y
	}
}

Player.prototype.copyStateToSprite = function(){
	this.mySprite.position.x = this.x;
	this.mySprite.position.y = this.y;
}

var InputState = function(keys, sequenceNumber){

	this.keys = keys;
	this.sequenceNumber = sequenceNumber;
	this.removeMe = false;

}

/***********************
* World functions
***********************/

var World = function(is_server, playerSocket, renderer){

	this.server = is_server;

	//The number of physics tick inputs to buffer before syncing with server side ticks 
	this.inputToSimlationBuffer = 5;
	//The tick rate of the physics timer, all time sensitive values (speeds) should be adjusted using this
	this.physTimerTickRate = 50;
	//The number of physics ticks to progress before the client uses forward prediction to sync the player
	//position with the server position (+ buffer)
	this.serverSyncInterval = 10;


	this._pdt = 0.0001;                 //The physics update delta time
    this._pdte = new Date().getTime();  //The physics update last delta time
    //A local timer for precision on server and client
    /*this.local_time = 0.016;            //The local timer
    this._dt = new Date().getTime();    //The local timer delta
    this._dte = new Date().getTime();   //The local timer last frame time*/

    this.worldState = {
    	players : {}
    }

    //Start a physics loop, this is separate to the rendering
    //as this happens at a fixed frequency
    this.create_physics_simulation(0);

    //Start a fast paced timer for measuring time easier
    //this.create_timer();

    this.physicsTickCounter = 0;
    this.renderer = false;

    if(!this.server) {
    	//Client specific
    	this.serverSyncIntervalCounter = 0;
		this.renderer = renderer;
    	this.me = new Player(playerSocket, this.renderer.players);
    }else{
    	//Server specific
    	this.server_time = 0;
        this.laststate = {};
    }

};


if( 'undefined' != typeof global ) {
    module.exports = global.World = World;
}

 
World.prototype.create_timer = function(){
    setInterval(function(){
        this._dt = new Date().getTime() - this._dte;
        this._dte = new Date().getTime();
        this.local_time += this._dt/1000.0;
    }.bind(this), 4);
}



//Main update function
//
World.prototype.update = function(t) {
    
	//Work out the delta time
    this.dt = this.lastframetime ? ( (t - this.lastframetime)/1000.0).fixed() : 0.016;

	//Store the last frame time
    this.lastframetime = t;

	//Update the game specifics
    if(!this.server) {
        this.client_update();
    } else {
        this.server_update();
    }

    //schedule the next update
    this.updateid = window.requestAnimationFrame( this.update.bind(this), this.viewport );

};


World.prototype.create_physics_simulation = function(adjustBy) {

	//All the time stuff in here is to try to force a constant timeframe
	//It works if the offset is too short by any amount
	//It doesn't work if execution is delayed by greater than tick rate (uh oh)

	var physTimerStartTime = new Date().getTime();
	var expectedRunTime = this.physTimerTickRate + adjustBy;


	//TODO: add a carry over offset if the adjustBy is less than -tickRate

	expectedRunTime = Math.max(expectedRunTime, 0);

    setTimeout(function(){
    	//These are only used for animating between state updates I believe
        this._pdt = (new Date().getTime() - this._pdte)/1000.0;
        this._pdte = new Date().getTime();
        this.update_physics();
        this.physicsTickCounter++;
        //TODO: need to handle this loop somewhere - maybe adjust all players here too
        if(this.physicsTickCounter >= 10000000){
        	this.physicsTickCounter = 0;
        }
        if(this.physicsTickCounter%100 == 0){
        	console.log(this.physicsTickCounter);
        }

        var adjustBy = expectedRunTime - (new Date().getTime() - physTimerStartTime);
        

        this.create_physics_simulation(adjustBy);

    }.bind(this), expectedRunTime);

};

World.prototype.update_physics = function(){
	if(this.server) {
        this.server_update_physics();
    } else {
        this.client_update_physics();
    }
}


/*******************
* Server functions
*******************/

World.prototype.server_update = function(){
	//console.log('server update');

	//Create a state snapshot
	//TODO: make a worldState function that gets the state of everything
	//Or even better - have a global representation of state that we can just send directly
	var snapShot = {
		players : [],
		physicsTick : 0
	};
    for (var key in this.worldState.players) {
    	var thisPlayer = this.worldState.players[key];
    	if(thisPlayer.receivedFirstInput){
	    	snapShot.players.push(thisPlayer.getState());
	    }
    }

    var message = {
    	type : 3,
    	pl : snapShot
    }

	//Send it to all players
    for (var key in this.worldState.players) {
    	var thisPlayer = this.worldState.players[key];
    	message.pl.physicsTick = this.physicsTickCounter - thisPlayer.tickCounterOffset;
    	thisPlayer.socket.emit('message', message);
    }

}

World.prototype.server_update_physics = function() {

    //------------------
    //Players send an input state every physics tick
    //States have a sequence number
    //Sequence number is synced on physics engine start
    //Need to keep a global World physics tick counter (how to handle loops in World ticker)
    //For each tick check if we have an input for each player for this tick
    //If yes run it, if no copy the previous state
    //------------------

    //For each player
    //Peek latest input - 
    	//if in the past discard and peek next
    	//if in future just ignore and copy previous state,
    	//if exact match, use it
    	//if none exist copy previous state 


    for (var key in this.worldState.players) {
    	var thisPlayer = this.worldState.players[key];
    	var selectedInput = false;
    	for(var j = 0; j < thisPlayer.inputs.length; j++){
    		var thisInput = thisPlayer.inputs[j];
    		if(thisInput.sequenceNumber < this.physicsTickCounter - thisPlayer.tickCounterOffset){
    			//This input is earlier than current phys tick - can be deleted
    			thisInput.removeMe = true;
    		}
    		if(thisInput.sequenceNumber == this.physicsTickCounter - thisPlayer.tickCounterOffset){
    			selectedInput = thisInput;
    			thisInput.removeMe = true;
    			break;
    		}
    	}
    	if(selectedInput === false){
    		selectedInput = thisPlayer.previousInput;
    	}

    	thisPlayer.previousInput = selectedInput;

		//Clean up any inputs that are no longer needed
    	//console.log('input length: '+thisPlayer.inputs.length);

    	for(var k = thisPlayer.inputs.length - 1 ; k >= 0; k--){
    		if(thisPlayer.inputs[k].removeMe){
    			thisPlayer.inputs.splice(k, 1);
    		}
    	}

    	//Only update player state if a previous input is available - stay still at beginning
    	if(selectedInput !== false){
    		//Run the physics simulation given the selectedInput for this player
	    	thisPlayer.x+=1;
	    }else{
	    	//No input for this player - should never happen, just simulate them with an empty input I suppose
	    }
    	
    }

};

World.prototype.serverAddInputToPlayer = function(playerId, message){
	if(this.worldState.players[playerId]){
		var player = this.worldState.players[playerId];
		player.inputs.push(message);
		if(!player.receivedFirstInput){
			player.receivedFirstInput = true;
			//This input is for the next physics tick
			player.tickCounterOffset = (this.physicsTickCounter + this.inputToSimlationBuffer)  - message.sequenceNumber;
		}
	}
}

World.prototype.serverAddPlayer = function(socket){
	if(!this.worldState.players[socket.playerId]){
		console.log('Added player: '+socket.playerId);
		var player = new Player(socket);
		this.worldState.players[socket.playerId] = player;
	}
}





/***********************
* Client functions
***********************/

World.prototype.client_update = function(){
	//Draw the stuff
	this.me.copyStateToSprite();
	this.renderer.render();
}

World.prototype.client_update_physics = function() {

	//TODO: Get keyboard state
	var keys = {
		u : 1,
		d : 0,
		l : 0,
		r : 0
	};

	var inputState = new InputState(keys, this.physicsTickCounter);
	this.me.addInput(inputState);

    //Update physics for current user
    this.me.x+=1 ;

    //Send keyboard state to server
    var message = createInputMessage(inputState);
    this.me.socket.emit('message', message);

};

World.prototype.clientUpdateStatus = function(status){
	//console.log('received state fr phys tick: '+status.physicsTick);
	
	//console.log('Server thinks i\'m at: '+status.players[0].x+' in tick: '+status.physicsTick+' I am at: '+this.me.x+' in tick '+this.physicsTickCounter);
	if(status.physicsTick >= 0){
		for(var index in status.players){
			var thisPlayer = status.players[index];

			if(thisPlayer.playerId == this.me.playerId){
				this.clientUpdateOwnPosition(status, thisPlayer);
			}else{
				this.clientUpdatePlayerPosition(status, thisPlayer);
			}

		}
	}
}

World.prototype.clientUpdateOwnPosition = function(status, thisPlayer){

	//We need to simulate physics ticks from this point to the simulated point
	//Then compare to what we have. If it's different we need to adopt it

	//This doesn't need to occur every tick so limit it using the serverSyncInterval
	if(this.serverSyncIntervalCounter < this.serverSyncInterval){
		this.serverSyncIntervalCounter++;
		return;
	}

	var predictedPosition = thisPlayer;
	
	for(var i = 0;i < this.me.inputs.length;i++){

		var thisInput = this.me.inputs[i];

		if(thisInput.sequenceNumber < status.physicsTick){
			//Input is before timeframe so just disregard
			thisInput.removeMe = true;
		}else if(thisInput.sequenceNumber <= this.physicsTickCounter){
			//Input is between the server tick and the local tick
			predictedPosition.x ++;
		}

	}

	for(var k = this.me.inputs.length - 1 ; k >= 0; k--){
		if(this.me.inputs[k].removeMe){
			this.me.inputs.splice(k, 1);
		}
	}

	//TODO: this needs lots of physics ticks performing really
	var diff = this.me.x - predictedPosition.x;
	if(diff != 0){
		//Set the player to be in the predicted position 
		//Todo: animate this
		this.me.x = predictedPosition.x;
	}

	this.serverSyncIntervalCounter = 0;

	
}

World.prototype.clientUpdatePlayerPosition = function(status, thisPlayer){
	if(typeof this.worldState.players[thisPlayer.playerId] == 'undefined'){
		//This player doesn't exist yet
		var newPlayer = new Player(false);
		newPlayer.x = thisPlayer.x;
		newPlayer.playerId = thisPlayer.playerId;

		this.worldState.players[thisPlayer.playerId] = newPlayer;
	}else{
		//Just update position
		//TODO: Animate this
		//TODO: display a past state rather than the current so we can interpolate
		//TODO: detect when a frame render comes between two physics ticks - adjust animation appropriately
		this.worldState.players[thisPlayer.playerId].x = thisPlayer.x;
	}
}


/******************
* Helper functions
******************/

Number.prototype.fixed = function(n) { n = n || 3; return parseFloat(this.toFixed(n)); };

function createInputMessage(inputState){
	return {
		type : 2,
		pl : inputState
	}
}
