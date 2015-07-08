

var OverviewMap = function(world, player){

	var self = this;

	this.clientWorld = world;
	this.player = player;

	this.element = $('<div class="page overview-map hidden">Overview map</div>');
	this.addToWorld = $('<button>Add To World</button>');
	this.element.append(this.addToWorld);

	$('body').append(this.element);

	this.addToWorld.click(function(){
		self.player.requestWorldEntry();
	});

}

OverviewMap.prototype.updateMap = function(){
	//Update the map from the world state

}

OverviewMap.prototype.show = function(){
	//Show the world state
	$('.page').removeClass('shown').addClass('hidden');
	this.element.removeClass('hidden').addClass('shown');
}

module.exports = exports = OverviewMap;