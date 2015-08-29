var Renderer 		= require('./Renderer');

var GameScreen = function(world){

	this.clientWorld = world;

	global.renderer = new Renderer();

	this.element = $('<div class="page game-screen hidden">Game Screen</div>');

	$('body').append(this.element);

	global.renderer.initialise(this.element.get(0));

}

GameScreen.prototype.show = function(){
	//Show the world state
	$('.page').removeClass('shown').addClass('hidden');
	this.element.removeClass('hidden').addClass('shown');
}

module.exports = exports = GameScreen;