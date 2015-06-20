var _ = require('lodash');
var Matter = require('matter-js');

var WorldState = function(){

	this._state = {
		objects : {},
		players : {},
		currentPlayer : null
	};

	this.previousObjectStates = {};

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

	if(player.socket){
		player.socket.on('disconnect', function(){
			self.removeObject(playerId);
		});
	}

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

WorldState.prototype.recordObjectStatesForPhysicsTick = function(tick){

	//We just use this to compare to shooting against so we only need position and angle

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