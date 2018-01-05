$(function () {
    const Qticket = window.Qticket,
    socket = Qticket.getIOInstance('dashboard'),
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
    };

    let scope;
    
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
                dashboardManager.dashbScreenUpdate(data);
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
                console.log('Web Socket connection established');
            });
        },
        init: function() {
            this.connect();
        }
    },
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
        getColumnChangesDiff: function(data, target) {
            let row;
            
            for (let elem in data) {
                obj = target.find('#'+data[elem].id);

                if (obj !== undefined) {
                    data.splice(elem, 1);
                } else {
                    dashboardManager.compileOrderRow(data[elem], target);
                }
            }
        },
        dashbScreenInit: function(data) {
            self.dashboardManager.dashbScreenUpdate(data);

            dashboardManager.attachDashboardListeners();
            tcksDashb.removeClass(hideClass);
            Qticket.toggleLoadScreen(false);
        },
        dashbScreenUpdate: function(data) {
            let draftsCol, ordersCol;

            draftsColumn.empty();
            ordersColumn.empty();

            for (let i in data.drafts) {
                draftsCol += dashboardManager.compileOrderRow(data.drafts[i], draftsColumn);
            }

            for (let i in data.orders) {
                ordersCol += dashboardManager.compileOrderRow(data.orders[i], ordersColumn);
            }
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
        startProcedure: function() {
            scope.webSocketStart();
            startButton.addClass(hideClass);
            stopButton.removeClass(hideClass);
        },
    	attachListeners: function() {
            startButton.on('click', function(e) {
                dashboardManager.startProcedure();
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
            if (Qticket.getUrlParam('dashinit') === 'true') {
                dashboardManager.startProcedure();
            }
    	}
    }
    dashboardManager.init();
    socketManager.init();
});