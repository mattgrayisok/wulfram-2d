var Matter = require('matter-js/src/module/main.js');
var _ 		= require('lodash');
var MoveableObject = require('./MoveableObject');


var Tank = function(position, angle, parentWorld){
	var self = this;

	this.base = MoveableObject;
	this.base(global.config.playerStartHealth, position, angle, global.config.playerVertices, 'players', parentWorld);

	if(global.isClient){
		var texture = PIXI.Texture.fromImage("assets/images/tank.png");
		this.setTexture(texture);
	}

}

Tank.prototype = Object.create(MoveableObject.prototype);
Tank.prototype.objectType = 'tank';


Tank.prototype.applyActionsForPhysicsTick = function(tick){
	MoveableObject.prototype.applyActionsForPhysicsTick.call(this);
}

module.exports = exports = Tank;
