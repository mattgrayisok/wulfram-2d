

var RenderClock = function(callback, context){

	this.callback = callback;
	this.updateid = false;
	this.context = context;
    
    var vendors = [ 'ms', 'moz', 'webkit', 'o' ];
    for ( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++ x ) {
        window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
        window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ] || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
    }

}

RenderClock.prototype.loop = function(){
	this.callback.bind( this.context )();
	this.updateid = window.requestAnimationFrame( this.loop.bind(this) );
}

RenderClock.prototype.start = function(){
	this.updateid = window.requestAnimationFrame( this.loop.bind(this) );
}

RenderClock.prototype.stop = function(){
	window.cancelAnimationFrame( this.updateid );
}

exports.RenderClock = RenderClock;