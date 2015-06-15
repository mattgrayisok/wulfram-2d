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

exports.WorldState = WorldState;