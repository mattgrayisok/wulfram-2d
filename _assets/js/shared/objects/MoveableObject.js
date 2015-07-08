var Matter = require('matter-js/build/matter.js');
var _ 		= require('lodash');
var ShootableObject = require('./ShootableObject');

var MoveableObject = function(health, position, angle, vertices, renderLayer, parentWorld){
	this.base = ShootableObject;
	this.base(health, position, angle, vertices, false, renderLayer, parentWorld);

}

MoveableObject.prototype = Object.create(ShootableObject.prototype);
MoveableObject.prototype.objectType = 'moveable';


module.exports = exports = MoveableObject;
