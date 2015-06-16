var Config 			= require('./shared/Config');
var Helpers 		= require('./shared/Helpers');
var ClientCore 		= require('./client/ClientCore');

global.config = new Config.Config();
global.helpers = new Helpers.Helpers();

console.log(global.helpers);

window.onload = function(){

	var clientCore = new ClientCore.ClientCore();
	clientCore.init();

};