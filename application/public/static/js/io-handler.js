$(function () {
    let self, sckId, csOrdersArray,
    socket = io(),
    body = $('body'),
    ordersContainer = body.find('.orders-screen'),
    templates= {
        orderCard: '<div class="col-xs-3 order-card" orderid="${id}">\
                        <div class="panel panel-primary">\
                            <div class="panel-heading">\
                                <div class="row">\
                                    <div class="col-xs-3">\
                                        <!-- <i class="fa fa-comments fa-5x"></i> -->\
                                    </div>\
                                    <div class="col-xs-9 text-right">\
                                        <div class="huge">${ticket}</div>\
                                        <div>${id} - ${client[1]}</div>\
                                    </div>\
                                </div>\
                            </div>\
                            <a href="#">\
                                <div class="panel-footer">\
                                    <span class="pull-left">View Details</span>\
                                    <span class="pull-right"><i class="fa fa-arrow-circle-right"></i></span>\
                                    <div class="clearfix"></div>\
                                </div>\
                            </a>\
                        </div>\
                    </div>',
        orderCardContent:   '<div class="panel panel-primary">\
                                <div class="panel-heading">\
                                    <div class="row">\
                                        <div class="col-xs-3">\
                                            <!-- <i class="fa fa-comments fa-5x"></i> -->\
                                        </div>\
                                        <div class="col-xs-9 text-right">\
                                            <div class="huge">${ticket}</div>\
                                            <div>${id} - ${client[1]}</div>\
                                        </div>\
                                    </div>\
                                </div>\
                                <a href="#">\
                                    <div class="panel-footer">\
                                        <span class="pull-left">View Details</span>\
                                        <span class="pull-right"><i class="fa fa-arrow-circle-right"></i></span>\
                                        <div class="clearfix"></div>\
                                    </div>\
                                </a>\
                            </div>'
    },
    socketManager = {
        checkSocketMsg: function(socketMsg) {
            let sqID = sckId + 1 ;

            if(socketMsg.sID === sckId){
                return {status: true, data: socketMsg.data};
            } else {
                socket.emit('sync');
                return {status: false};
            }
        },
        updateOrdersView: function(changesList) {
            if (changesList) {
                if (changesList.added && changesList.added.length > 0) {    
                    for (let key in changesList.added) {
                        csOrdersArray.push(changesList.added[key]);
                        $.tmpl(templates.orderCard, changesList.added[key]).appendTo( ".orders-screen" );
                    }
                }
                if (changesList.updated && changesList.updated.length > 0) {
                    for (let xKey in changesList.updated) {
                        for (let yKey in csOrdersArray) {
                            if (changesList.updated[xKey].id === csOrdersArray[yKey].id) {
                                $.each(ordersContainer.find('.order-card'), function(index, element) {
                                    if ($(element).attr('orderid') == csOrdersArray[yKey].id) {
                                        $(element).empty();
                                        $.tmpl(templates.orderCardContent, changesList.updated[xKey]).appendTo(element);
                                    }
                                });
                                csOrdersArray[yKey] = changesList.updated[xKey]
                            }
                        }
                    }
                }
                if (changesList.removed && changesList.removed.length > 0) {
                    for (let xKey in changesList.removed) {
                        for (let yKey in csOrdersArray) {
                            if (changesList.removed[xKey] === csOrdersArray[yKey].id) {
                                let index = csOrdersArray.indexOf(csOrdersArray[yKey]);

                                $.each(ordersContainer.find('.order-card'), function(index, element) {
                                    if ($(element).attr('orderid') == csOrdersArray[yKey].id) {
                                        element.remove();
                                    }
                                });

                                if (index > -1) {
                                    csOrdersArray.splice(index, 1);
                                }
                            }
                        }
                    }
                }
            }

        },
        initOrdersView: function(ordersArray) {
            $.tmpl(templates.orderCard, ordersArray).appendTo( ".orders-screen" );
        },
        attachListeners: function() {
            socket.on('orderUpdate', function(counter){
                //@TODO Update Single Order   
            });

            socket.on('ordersUpdate', function(socketMsg){
                //@TODO Check on Sequence check functionality
                //dataSet = self.checkSocketMsg(socketMsg);
                dataSet = {status: true, data: socketMsg.data};
                if (dataSet.status) {
                    self.updateOrdersView(dataSet.data);
                }
            });

            socket.on('sync', function(sckData) {
                sckId = sckData.sID;
                self.initOrdersView(sckData.data);
            });

            socket.on('init', function(sckData) {
                sckId = sckData.sID;
                csOrdersArray = sckData.data;
                self.initOrdersView(sckData.data);
            });
        },
        init: function() {
            self = this;
            self.attachListeners();
        }
    }
    socketManager.init();
});