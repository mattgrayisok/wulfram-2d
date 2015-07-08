var _ = require('lodash');
var Matter = require('matter-js/build/matter.js');
var Tank = require('../shared/objects/Tank');

var WorldState = function(world){

	this._state = {
		objects : {},
		players : {},
		currentPlayer : null
	};

	this.previousObjectStates = {};
	this.receivedStates = [];
	this.stateMilliOffset = false;
	this.parentWorld = world;

}

WorldState.prototype.getPlayer = function(objectId){
	return this._state.players[objectId];
}

WorldState.prototype.getObject = function(objectId){
	return this._state.objects[objectId];
}

WorldState.prototype.addPlayer = function(player){
	
	var self = this;

	this.addObject(player);
	var playerId = player.objectId;
	this._state.players[playerId] = player;

	/*if(global.isServer){
		player.on('died', function(){
			console.log('died');
		});
	}*/

}

WorldState.prototype.addObject = function(object){
	var objectId = object.objectId;
	this._state.objects[objectId] = object;
}

WorldState.prototype.getAllObjects = function(){
	return this._state.objects;
};

WorldState.prototype.getAllPlayers = function(){
	return this._state.players;
};

WorldState.prototype.removeObject = function(object){
	
	var objectId = '';

	if(typeof object == 'string'){
		objectId = object;
	}else{
		objectId = object.objectId;
	}

	console.log('Removing '+objectId);

	if(typeof this._state.objects[objectId] == 'object'){
		this._state.objects[objectId].remove();
		delete this._state.objects[objectId];
	}

	if(typeof this._state.players[objectId] == 'object'){
		delete this._state.players[objectId];
	}

}

WorldState.prototype.toMessage = function(){
	
	var players = [];

	_.each(this._state.players, function(el, ind){
		players.push(el.toMessage());
	});

	return {
		players: players
	};
} 

WorldState.prototype.removePlayersNotIn = function(list){
	for(var index in this._state.players){
		var thisPlayer = this._state.players[index];
		if(!_.includes(list, thisPlayer.objectId)){
			this.removeObject(thisPlayer);
		}
	}
}

//Client only
WorldState.prototype.addReceivedState = function(newWorldState){
	this.receivedStates.push(newWorldState);

	var includedPlayers = [];

	//Create all new objects

	//Players
	for(var index in newWorldState.players){
		var thisPlayer = newWorldState.players[index];
		includedPlayers.push(thisPlayer.objectId);
		
		var player = this.getPlayer(thisPlayer.objectId);
		if(typeof player == 'undefined'){
			player = new Tank(thisPlayer.position, thisPlayer.angle, this.parentWorld);
			player.objectId = thisPlayer.objectId;
			this.addPlayer(player);
		}
		
	}

	this.removePlayersNotIn(includedPlayers);

}

//Client only
WorldState.prototype.updateAllObjectsFromReceivedStates = function(){

	var self = this;

	//Not set offset yet and no buffer filled
	if(this.stateMilliOffset === false && this.receivedStates.length < global.config.clientSideRenderBuffer){
		// ? 
		return;
	}

	//Buffer is filled enough. We need to set the offset from the first state in the buffer
	if(this.stateMilliOffset === false){
		this.stateMilliOffset = new Date().getTime() - this.receivedStates[0].time;
	}

	//Find what we expect the server time to be.
	var expectedServerTime = new Date().getTime() - this.stateMilliOffset;

	//Find the two states that surround that time
	var justBelowIndex = false;
	var justAboveIndex = false;
	var justBelow = false;
	var justAbove = false;


	_.each(this.receivedStates, function(el, ind){
		//If we are yet to find a state with a high enough time
		if(expectedServerTime < el.time && justAboveIndex === false){
			//Found the first one above expected time
			if(ind > 0){
				justBelowIndex = ind - 1;
				justBelow = self.receivedStates[justBelowIndex];
				justBelow.deleteMe = false;
			}
			justAboveIndex = ind;
			justAbove = el;
		}else if(justAboveIndex === false){
			//Here we'll only see states pre expected server time
			//Keep the final two states, even if they are in the past
			if(ind < self.receivedStates.length - 2){
				el.deleteMe = true;
			}
		}
	});

	//Delete any old ones
	for(var i = self.receivedStates.length - 1; i >= 0; i--){
		var el = self.receivedStates[i];
		if("deleteMe" in el && el.deleteMe){
			self.receivedStates.splice(i, 1);
		} 
	}


	if(justAboveIndex !== false){
		if(justBelowIndex !== false){
			//We have an above state and a below state. Just interpolate between the two
			var timeDiff = justAbove.time - justBelow.time;
			var percentIn = (expectedServerTime - justBelow.time) / timeDiff;
			//For all values, find the difference, multiply by percentIn and add to below state

			this.setStateByInterpolation(justBelow, justAbove, percentIn);

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
			if(this.receivedStates.length >= 2){
				//There are no states in front of expected time, but there are states to use
				//Extrapolate out from the most recent two states
				justBelow = this.receivedStates[this.receivedStates.length-2];
				justAbove = this.receivedStates[this.receivedStates.length-1];
				var timeDiff = justAbove.time - justBelow.time;
				var percentPast = (expectedServerTime - justAbove.time) / timeDiff;

				this.setStateByExtrapolation(justBelow, 
														justAbove, 
														percentPast);

			}else if(this.receivedStates.length == 1){
				//Just use this state
				this.setState(this.receivedStates[0]);
			}else{
				//There are no states - should never happen
				//Just don't change anything I suppose
			}
		}
	}

}

WorldState.prototype.setState = function(state, exclude){
	var self = this;

	//Players
	for(var playerIndex in state.players){
		var playerState = state.players[playerIndex];
		var player = self.getPlayer(playerState.playerId);
		player.setState(playerState);
	}
}

WorldState.prototype.setStateByInterpolation = function(state1, state2, percent, exclude){
	var self = this;
	//Players
	self.findMatchingStatesFromTwoStateCollections(state1.players, state2.players, "objectId", function(state1, state2, propertyValue){
		var player = self.getPlayer(propertyValue);
		if(typeof player == 'undefined' || player.objectId == exclude) return;
		player.setStateByInterpolation(state1, state2, percent);
	});

}

WorldState.prototype.setStateByExtrapolation = function(state1, state2, percent, exclude){
	var self = this;

	//Players
	self.findMatchingStatesFromTwoStateCollections(state1.players, state2.players, "objectId", function(state1, state2, propertyValue){
		var player = self.getPlayer(propertyValue);
		if(typeof player == 'undefined' || player.playerId == exclude) return;
		player.setStateByExtrapolation(state1, state2, percent);
	});

}

WorldState.prototype.findMatchingStatesFromTwoStateCollections = function(state1Collection, state2Collection, propertyToCompare, callback){
	
	for(var state1Index in state1Collection){
		var state1Object = state1Collection[state1Index];
		for(var state2Index in state2Collection){
			if(state1Object[propertyToCompare] == state2Collection[state2Index][propertyToCompare]){
				callback(state1Object, state2Collection[state2Index], state1Object[propertyToCompare]);
				break;
			}
		}
	}

}

WorldState.prototype.getAllPlayerBodies = function(excluding){
	var toReturn = [];
	for(var playerId in this._state.players){
		if (playerId != excluding){
			toReturn.push(this._state.players[playerId].body);
		}
	}
	return toReturn;
}


//Record the current state and assign it to the given tick
//These are used for checking for shooting people later so we just need positions
//Server only
WorldState.prototype.recordObjectStatesForPhysicsTick = function(tick){

	this.previousObjectStates[""+tick] = {objects : {}};
	for(var objectId in this._state.objects){
		var thisObject = this._state.objects[objectId];
		this.previousObjectStates[""+tick].objects[objectId] = {
			position: thisObject.body.position,
			angle: thisObject.body.angle,
			vertices: thisObject.vertices
		}
	}

	//Clean up old ones every ~200th tick
	if(Math.random() > 0.995){
		for(var tickIndex in this.previousObjectStates){
			if(parseInt(tickIndex) < tick - 200){
				delete this.previousObjectStates[tickIndex];
			}
		}
	}

}

WorldState.prototype.getPlayerBodiesForTick = function(tick, exclude){
	
	//FIXME: The array returned from this will be pass by reference, we need to make a copy.
	var allBodies = this.getAllShootableBodiesForTick(tick, exclude);
	/*for(var i = allBodies.length - 1; i >= 0; i--){
		if(allBodies[i].objectType !== 'player'){
			allBodies.splice(i, 1);
		}
	}*/

	return allBodies;

}

//Uses the previousObjectStates array
WorldState.prototype.getAllShootableBodiesForTick = function(tick, exclude){
	var state = this.previousObjectStates[""+tick];
	var self = this;

	if(typeof state == 'undefined'){
		return [];
	}
	
	if(typeof state.bodies == 'undefined'){
		state.bodies = [];
		_.each(state.objects, function(thisObject, objectId){

			if(objectId != exclude){
				var body = Matter.Body.create({ 	
					angle: thisObject.angle,
					position: thisObject.position,
					vertices: thisObject.vertices
				});
				body.parentObject = self.getObject(objectId);
				state.bodies.push(body);
			}
		});
	}

	return state.bodies;
}

module.exports = exports = WorldState;