

var Renderer = function(){
	this.renderer = false;
	this.stage = false;
	this.hud = false;
	this.world = false;
}

Renderer.prototype.initialise = function(){
	this.renderer = PIXI.autoDetectRenderer($('html').width(), $('html').height(),{backgroundColor : 0x990000});
	document.body.appendChild(this.renderer.view);

	this.stage = new PIXI.Container();
	this.hud = new PIXI.Container();
	this.world = new PIXI.Container();
	this.players = new PIXI.Container();

	var background = PIXI.Sprite.fromImage("assets/images/background.jpg");
	this.stage.addChild(background);
	
	//Add players to world
	this.world.addChild(this.players);
	//Add world to display
	this.stage.addChild(this.world);
	//Add hud to display
	this.stage.addChild(this.hud);


}

Renderer.prototype.render = function(){
	
	this.renderer.render(this.stage);

}

module.exports = exports = Renderer;