var Matter 	= require('matter-js');
var _ 		= require('lodash');
var WorldObject = require('./WorldObject');

var ShootableObject = function(health, position, angle, vertices, isStatic, renderLayer, parentWorld){
	this.base = WorldObject;
	this.base(position, angle, vertices, isStatic, renderLayer, parentWorld);

	this.health = health;
}

ShootableObject.prototype = Object.create(WorldObject.prototype);
ShootableObject.prototype.objectType = 'shootable';

ShootableObject.prototype.reduceHealth = function(amount){

}

ShootableObject.prototype.increaseHealth = function(amount){

}

module.exports = exports = ShootableObject;
