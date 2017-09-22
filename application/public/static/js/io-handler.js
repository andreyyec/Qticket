$(function () {
    var scope, 
    socket = io(),
    body = $('body'),
    socketManager = {
    	attachListeners: function() {
		    socket.on('orderUpdate', function(counter){
		      	
		    });

            socket.on('ordersFullUpdate', function(data){
               console.log('Socket IO Working'); 
            });
    	},
    	init: function() {
    		scope = this;
			scope.attachListeners();
    	}
    }
    socketManager.init();
});