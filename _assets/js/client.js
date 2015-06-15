var Config 			= require('./shared/Config');
var ClientCore 		= require('./client/ClientCore');

global.config = new Config.Config();

window.onload = function(){

	var clientCore = new ClientCore.ClientCore();
	clientCore.init();

};