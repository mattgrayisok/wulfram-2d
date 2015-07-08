

var LoadingScreen = function(world){

	this.clientWorld = world;

	this.element = $('<div class="page loading-screen hidden">Loading Screen</div>');

	$('body').append(this.element);

}

LoadingScreen.prototype.show = function(){
	//Show the world state
	$('.page').removeClass('shown').addClass('hidden');
	this.element.removeClass('hidden').addClass('shown');
}

module.exports = exports = LoadingScreen;