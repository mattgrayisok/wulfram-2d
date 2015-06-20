
var InputState = function(keys, physicsTickCounter){

	this.keys = keys;
	this.physicsTickCounter = physicsTickCounter;

}

InputState.prototype.toMessage = function(){
	return {
		type : 2,
		pl : this
	}
}

module.exports = exports = InputState;