var world = {};

	//When loading, we store references to our
	//drawing canvases, and initiate a game instance.
window.onload = function(){


	var renderer = new Renderer();
	renderer.initialise();

	var socket = io();
	
	socket.on('connected', function(msg){
	    //Create our game client instance.
		world = new World(false, socket, renderer);

		//Start the loop
		world.update( new Date().getTime() );

		socket.on('message', function(message){
			switch (message.type){
				case 3:
					//State message
					world.clientUpdateStatus(message.pl);
					break;
				default:
					break;
			}
		});
	});


}; //window.onload
