var Renderer 		= require('./Renderer');
var ClientWorld 	= require('./ClientWorld');

var world = {};
	//When loading, we store references to our
	//drawing canvases, and initiate a game instance.

var ClientCore = function(){

	this.world = {};

}

ClientCore.prototype.init = function(){

	var renderer = new Renderer.Renderer();
	renderer.initialise();

	var socket = io();
	
	socket.on('connected', function(msg){
	    //Create our game client instance.
		world = new ClientWorld.ClientWorld(renderer, socket);

		socket.on('message', function(message){
			switch (message.type){
				case 3:
					//State message
					world.receivedServerState(message.pl);
					break;
				default:
					break;
			}
		});
	});

}

exports.ClientCore = ClientCore;