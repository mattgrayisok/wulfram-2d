var PhysicsClock = function(callback, context){

	this.timerId = false;
	this.running = false;
	this.callback = callback;
	this.context = context;

}

PhysicsClock.prototype.loop = function(adjustBy){

	if(!this.running){
		return;
	}

	var startTime = new Date().getTime();
	var expectedRunTime = global.config.physicsClock_ms + adjustBy;

	//TODO: add a carry over offset if the adjustBy is less than -tickRate
	var expectedRunTimeOrZero = Math.max(expectedRunTime, 0);

    setTimeout(function(){
    	//These are only used for animating between state updates I believe
        this._pdt = (new Date().getTime() - this._pdte)/1000.0;
        this._pdte = new Date().getTime();
        this.callback.bind( this.context )();

        var adjustBy = expectedRunTime - (new Date().getTime() - startTime);        
        this.loop(adjustBy);

    }.bind(this), expectedRunTimeOrZero);

}

PhysicsClock.prototype.start = function(){

	this.running = true;
	this.loop(0);

}

PhysicsClock.prototype.stop = function(){
	this.running = false;
}

module.exports = exports = PhysicsClock;