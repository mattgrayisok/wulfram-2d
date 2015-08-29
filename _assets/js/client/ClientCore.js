var Renderer 		= require('./Renderer');
var ClientWorld 	= require('./ClientWorld');
var OverviewMap 	= require('./OverviewMap');
var LoadingScreen 	= require('./LoadingScreen');
var GameScreen 		= require('./GameScreen');
var Player 			= require('../shared/Player');

var world = {};
	//When loading, we store references to our
	//drawing canvases, and initiate a game instance.

var ClientCore = function(){

	this.world = {};
	this.clientWorld = false;
	this.loadingScreen = false;
	this.overviewMap = false;
	this.gameScreen = false;	
	this.player = false;

}

ClientCore.prototype.init = function(){

	var self = this;

	//Goto loading screen
	this.gameScreen = new GameScreen();

	this.gotoLoading();

	//Connect to server
	var socket = io();

	//Create a simulation world
	this.clientWorld = new ClientWorld();

	//Create a player
	this.player = new Player(socket, this.clientWorld);

	this.player.on('added-to-world', function(){
		self.gotoGameScreen();
	})
	
	//The server has told us that we're connected
	socket.on('connected', function(msg){
	    //Create our game client instance.
	    //socket.emit('sync', 0);
		self.gotoOverviewMap();
	});

}

ClientCore.prototype.gotoLoading = function(){

	if(this.loadingScreen == false){
		this.loadingScreen = new LoadingScreen();
	}

	this.loadingScreen.show();

}

ClientCore.prototype.gotoOverviewMap = function(){

	if(this.overviewMap == false){
		this.overviewMap = new OverviewMap(this.clientWorld, this.player);
	}

	this.overviewMap.show();

}

ClientCore.prototype.gotoGameScreen = function(){

	if(this.gameScreen == false){
		this.gameScreen = new GameScreen();
	}

	this.gameScreen.show();

}


module.exports = exports = ClientCore;