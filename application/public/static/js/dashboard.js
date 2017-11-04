$(function () {
    var scope,
    Qticket = window.Qticket,
    socket = Qticket.getIOInstance('dashboard');
    body = $('body'),
    hideClass = 'hide',
    contentContainer = body.find('.content-container'),
    buttonsContainer = contentContainer.find('.action-buttons-container'),
    startButton = buttonsContainer.find('.start'),
    stopButton = buttonsContainer.find('.stop'),
    tcksDashb = contentContainer.find('.tickets-dashboard'),
    draftsColumn = tcksDashb.find('.drafts-column'),
    ordersColumn = tcksDashb.find('.orders-column'),
    templates = {
        orderRow:   '<div class="ticket-row" data-id="${id}" data-client="${client[1]}" data-ticket"${ticket}">\
                        <div class="ticket ticket-number">\
                            <span class="title">FICHA:</span>\
                            <span class="number">\
                                {{if (ticket !== false)}}${ticket}{{else}}-{{/if}}\
                            </span>\
                        </div>\
                        <div class="ticket ticket-info">${client[1]}</div>\
                    </div>'
    },
    socketManager = {
        attachListeners: function() {
            socket.on('data', function(data) {
                if (data !== undefined) {
                    dashboardManager.dashbScreenInit(data);
                } else {
                    alert('Error while trying to get Orders Object from server');
                } 
            });

            socket.on('update', function(data) {
                console.log('Orders Update Triggered');
                console.log(data);
                //dashboardManager.
            });

            socket.on('disconnect', function () {
                console.log('you have been disconnected');
            });

            socket.on('reconnect', function () {
                console.log('you have been reconnected');
            });

            /*socket.on('reconnect_error', function () {
                console.log('attempt to reconnect has failed');
            });*/
        },
        detachListerners: function() {
            socket.off();
        },
        requestData: function() {
            socket.emit('request');
        },
        start: function() {
            this.attachListeners();
            socketManager.requestData();
        },
        stop: function() {
            this.detachListerners();
        },
        connect: function() {
            socket.on('connect', function(sckData) {
                console.log('WebSocket connected');
            });
        },
        init: function() {
            this.connect();
        }
    }
    dashboardManager = {
        webSocketStart: function() {
            Qticket.toggleLoadScreen(true);
            socketManager.start();
        },
        compileOrderRow: function(obj, target = undefined, prepend = false) {
            if (target !== undefined) {
                if (!prepend) {
                     $.tmpl(templates.orderRow, obj).appendTo(target);
                } else {
                    $.tmpl(templates.orderRow, obj).prependTo(target);
                }
            } else {
                return $.tmpl(templates.nOrderRow, obj).outerHTML();
            }
        },
        dashbScreenInit: function(data) {
            let draftsCol, ordersCol;

            console.log(data);

            for (let i in data.drafts) {
                draftsCol += dashboardManager.compileOrderRow(data.drafts[i], draftsColumn);
            }
            for (let i in data.approved) {
                draftsCol += dashboardManager.compileOrderRow(data.approved[i], draftsColumn);
            }
            for (let i in data.confirmed) {
                ordersCol += dashboardManager.compileOrderRow(data.confirmed[i], ordersColumn);
            }
            dashboardManager.attachDashboardListeners();
            tcksDashb.removeClass(hideClass);
            Qticket.toggleLoadScreen(false);
        },
        dashbScreenUpdate: function(changesList) {

        },
        dashbScreenStop: function() {
            draftsColumn.empty();
            ordersColumn.empty();
            dashboardManager.detachDashboardListeners();
            socketManager.detachListerners();
        },
        attachDashboardListeners: function() {
            body.on('keydown', function(e) {
                if (e.keyCode === 27) {
                    tcksDashb.toggleClass(hideClass);
                }
            });
        },
        detachDashboardListeners: function() {
            body.unbind('keydown');
        },
    	attachListeners: function() {
            startButton.on('click', function(e) {
                scope.webSocketStart();
                startButton.addClass(hideClass);
                stopButton.removeClass(hideClass);
            });

            stopButton.on('click', function(e) {
                scope.dashbScreenStop();
                startButton.removeClass(hideClass);
                stopButton.addClass(hideClass);
            });
    	},
    	init: function() {
    		scope = this;
			scope.attachListeners();
    	}
    }
    dashboardManager.init();
    socketManager.init();
});