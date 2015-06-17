var _ = require('lodash');

var WorldState = function(){

	this._state = {
		players : {},
		currentPlayer : null
	};

}

WorldState.prototype.getPlayer = function(playerId){

	return this._state.players[playerId];

}

WorldState.prototype.addPlayer = function(player){
	
	var playerId = player.playerId;
	this._state.players[playerId] = player;

}

WorldState.prototype.removePlayer = function(player){
	
	var playerId = '';


	if(typeof player == 'string'){
		playerId = player;
	}else{
		playerId = player.playerId;
	}

	console.log('Removing '+playerId);

	if(typeof this._state.players[playerId] == 'object'){
		this._state.players[playerId].remove();
		delete this._state.players[playerId];
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
		if(!_.includes(list, thisPlayer.playerId)){
			this.removePlayer(thisPlayer);
		}
	}
}

WorldState.prototype.setState = function(state, exclude){
	console.log('setState');
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
	self.findMatchingStatesFromTwoStateCollections(state1.players, state2.players, "playerId", function(state1, state2, propertyValue){
		var player = self.getPlayer(propertyValue);
		if(typeof player == 'undefined' || player.playerId == exclude) return;
		player.setStateByInterpolation(state1, state2, percent);
	});

}

WorldState.prototype.setStateByExtrapolation = function(state1, state2, percent, exclude){
	var self = this;

	//Players
	self.findMatchingStatesFromTwoStateCollections(state1.players, state2.players, "playerId", function(state1, state2, propertyValue){
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

exports.WorldState = WorldState;