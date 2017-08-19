$(function () {
    var scope, 
    socket = io(),
    body = $('body'),
    faresBox = body.find('#daily-fares'),
    carsBox = body.find('#daily-cars'),
    socketManager = {
    	updateCounter: function (counter) {
            carsBox.html(counter);
    	},
        updateFare: function (fare) {
            faresBox.html('$'+fare);
        },
    	attachListeners: function() {
		    socket.on('counterUpdate', function(counter){
		      	scope.updateCounter(counter);
		    });

            socket.on('fareUpdate', function(fare){
                scope.updateFare(fare);
            });            
    	},
    	init: function() {
    		scope = this;
			scope.attachListeners();
    	}
    }
    socketManager.init();
});