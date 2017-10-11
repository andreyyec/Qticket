$(function () {
    let self, sckId, csOrdersArray, currentRow,
    socket = io(),
    body = $('body'),
    disableClass = 'disabled',
    selectedClass = 'selected',
    ordersContainer = body.find('.orders-screen'),
    orderDetailsContainer = body.find('.order-details-screen'),
    productsSection = orderDetailsContainer.find('.products-section'),
    productCards = productsSection.find('.product-card'),
    oDSection = orderDetailsContainer.find('.order-details-section'),
    oDProductsList = oDSection.find('.order-details-products-list'),
    oDProductsHolder = oDSection.find('.order-products-holder'),
    oDKeypad = oDSection.find('.order-keypad'),
    modifierButtons = oDKeypad.find('.modifier'),
    templates= {
        orderCard: '<div class="col-xs-6 col-sm-4 col-md-3 order-card" orderid="${id}">\
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
                            </div>',
        row:    '<div class="order-row" data-id="${id}">\
                    <div class="row inner" >\
                        <div class="col-8 bold product-name">${product}</div>\
                        <div class="col-4 product-price">&cent;${price}</div>\
                        <div class="col-12 product-qty">Cantidad: <span class="bold qty">1</span></div>\
                    </div>\
                </div>'
    },
    uiManager = {
        enableActionButtons: function() {
            modifierButtons.removeClass(disableClass);
        },
        disableActionButtons: function() {
            modifierButtons.addClass(disableClass);
        },
        cleanDetailUI: function() {
            productCards.removeClass(selectedClass);
        },
        addRow: function(card) {
            let nRowInfo = {id: card.attr('data-id'),
                        product: card.attr('data-name'),
                        price: card.attr('data-price')},
                nRow = $.tmpl(templates.row, nRowInfo).appendTo(oDProductsList);
            uiManager.updateCurrentRow(nRow);
            uiManager.enableActionButtons();
            card.addClass(selectedClass);
        },
        removeRow: function(row) {

        },
        updateCurrentRow: function (row) {
            if (currentRow !== undefined) {
                currentRow.removeClass(selectedClass);
                row.addClass(selectedClass);
                currentRow = row;
            } else {
                row.addClass(selectedClass);
                currentRow = row;
            }
        },
        attachListeners: function() {
            productsSection.on('click', '.product-card', function(e){
                let card = $(e.currentTarget);
                if (!card.hasClass(selectedClass)) {
                    uiManager.addRow(card);
                }
            });
        },
        init: function() {
            uiManager.attachListeners();
        }
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
                                    if ($(element).attr('orderid') == csOrdersArray[yKey].id) { element.remove();}
                                });

                                if (index > -1) { csOrdersArray.splice(index, 1);}
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
                //dataSet = socketManager.checkSocketMsg(socketMsg);
                dataSet = {status: true, data: socketMsg.data};
                if (dataSet.status) {
                    socketManager.updateOrdersView(dataSet.data);
                }
            });

            socket.on('init', function(sckData) {
                sckId = sckData.sID;
                csOrdersArray = sckData.data;
                socketManager.initOrdersView(sckData.data);
            });

            socket.on('disconnect', function() {
                //@TODO: Trigger reset data, screen, and spinner     when disconnected
                console.log('disconnect functionality');
            });
        },
        init: function() {
            socketManager = this;
            socketManager.attachListeners();
        }
    }
    self = this;
    uiManager.init();
    socketManager.init();
});