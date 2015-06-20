var Config 			= require('./shared/Config');
var Helpers 		= require('./shared/Helpers');
var ClientCore 		= require('./client/ClientCore');

global.config = new Config();
global.helpers = new Helpers();
global.isServer = false;
global.isClient = true;

window.onload = function(){

	var clientCore = new ClientCore();
	clientCore.init();

};