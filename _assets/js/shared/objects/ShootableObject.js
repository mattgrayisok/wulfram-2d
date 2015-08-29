var Matter = require('matter-js/src/module/main.js');
var _ 		= require('lodash');
var WorldObject = require('./WorldObject');

var ShootableObject = function(health, position, angle, vertices, isStatic, renderLayer, parentWorld){
	this.base = WorldObject;
	this.base(position, angle, vertices, isStatic, renderLayer, parentWorld);

	this.health = health;
	this.isDead = false;
}

ShootableObject.prototype = Object.create(WorldObject.prototype);
ShootableObject.prototype.objectType = 'shootable';

ShootableObject.prototype.reduceHealth = function(amount){

	this.health -= amount;
	if(this.health <= 0){
		this.isDead = true;
		this.emit('died');
	}
}

ShootableObject.prototype.increaseHealth = function(amount){
	this.health += amount;
}

module.exports = exports = ShootableObject;
