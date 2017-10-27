$(function () {
    var scope,
    body = $('body'),
    buttonsContainer = body.find('.action-buttons-container'),
    startButton = buttonsContainer.find('.start'),
    stopButton = buttonsContainer.find('.stop'),
    dashboardManager = {
    	attachListeners: function() {
            startButton.on('click', function(e) {
                console.log('start triggered');
            });
            stopButton.on('click', function(e) {

            });
    	},
    	init: function() {
    		scope = this;
			scope.attachListeners();
    	}
    }
    dashboardManager.init();
});
