var Helpers = function(){

}

Helpers.prototype.interpolate = function(val1, val2, percent){
	return val1 + ((val2 - val1) * percent);
}

Helpers.prototype.interpolateVector = function(val1, val2, percent){
	return { x : val1.x + ((val2.x - val1.x) * percent) , y : val1.y + ((val2.y - val1.y) * percent)};
}

Helpers.prototype.extrapolate = function(val1, val2, percent){
	return val2 + ((val2 - val1) * percent);
}

Helpers.prototype.extrapolateVector = function(val1, val2, percent){
	return { x : val2.x + ((val2.x - val1.x) * percent) , y : val2.y + ((val2.y - val1.y) * percent)};
}

module.exports = exports = Helpers;