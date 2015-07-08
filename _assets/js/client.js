var Config 			= require('./shared/Config');
var Helpers 		= require('./shared/Helpers');
var ClientCore 		= require('./client/ClientCore');
var events = require('events');


global.config = new Config();
global.helpers = new Helpers();
global.isServer = false;
global.isClient = true;
global.pubsub = new events.EventEmitter(); 

window.onload = function(){

	var clientCore = new ClientCore();
	clientCore.init();

};