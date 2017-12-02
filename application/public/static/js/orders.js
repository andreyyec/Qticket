$(function () {
    let self, sckId, csOrdersArray, currentRow = {}, currentOrderData = {}, override = true, actionEnabled = false,
    socket = Qticket.getIOInstance('orders'), body = $('body'), blockedClass = 'blocked', disabledClass = 'disabled', selectedClass = 'selected', activeClass = 'active',
    ordersContainer = body.find('.orders-screen'),
    orderDetailsContainer = body.find('.order-details-screen'),
    productsSection = orderDetailsContainer.find('.products-section'),
    productCards = productsSection.find('.product-card'),
    oDSection = orderDetailsContainer.find('.order-details-section'),
    clientInfoBar = oDSection.find('.client-info'),
    oDProductsList = oDSection.find('.order-details-products-list'),
    oDProductsHolder = oDSection.find('.order-products-holder'),
    mobileTabs = orderDetailsContainer.find('.mobile-tabs .tab'),
    mobileSections = orderDetailsContainer.find('.display-section'),
    oDKeypad = oDSection.find('.order-keypad'),
    modifierButtons = oDKeypad.find('.modifier'),
    keyButtons = oDKeypad.find('.key'),
    cancelButton = oDSection.find('.action-buttons-bar .cancel'),
    saveButton = oDSection.find('.action-buttons-bar .save'),
    doneButton = oDSection.find('.action-buttons-bar .done'),
    removeModifier = $(modifierButtons[0]),
    priceModifier = $(modifierButtons[1]),
    qtyModifier = $(modifierButtons[2]),
    //===> Templates Object
    templates= {
        nOrderCard: '<div class="col-6 col-sm-4 col-md-3">\
                        <div class="card card-inverse order-card" data-id="${id}" data-client-id="${client[0]}" data-client="${client[1]}" data-ticket="${ticket}">\
                            <div class="card-header card-header">\
                                ${id}\
                            </div>\
                            <div class="card-block bg-white card-body">\
                                <div class="ticket">{{if (ticket !== false)}}${ticket}{{else}}-{{/if}}</div>\
                                <div class="client">${client[1]}</div>\
                            </div>\
                        </div>\
                    </div>',
        orderCardContent:   '<div class="panel panel-primary">\
                                <div class="panel-heading">\
                                    <div class="row">\
                                        <div class="col-xs-3">\
                                            <!-- <i class="fa fa-comments fa-5x"></i> -->\
                                        </div>\
                                        <div class="col-xs-9 text-right">\
                                            <div class="huge">{{if (ticket !== false)}}${ticket}{{else}}-{{/if}}</div>\
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
                        <div class="col-4 product-price">&cent;<span class="price">${price}</span></div>\
                        <div class="col-12 product-qty">Cantidad: <span class="bold qty">1</span></div>\
                    </div>\
                </div>'
    },
    //===> Socket Manager
    socketManager = {
        blockOrder: (orderId) => {
            return new Promise((resolve, reject) => {
                socket.emit('blockOrder', {orderID: orderId, user: {username: Qticket.session.username, name:Qticket.session.displayname}}, (confirmation) => {
                    resolve(confirmation);
                });
            });
        },
        unBlockOrder: (orderId) => {
            return new Promise((resolve, reject) => {
                socket.emit('unblockOrder', orderId, (confirmation) => {
                    resolve(confirmation);
                });
            });
        },
        updateOrder: (orderData) => {
            socket.emit('updateOrder', orderData, (confirmation) => {
                //Rollback
                //resolve(confirmation);

                console.log(confirmation);
            });
        },
        updateOrdersView: (changesList) => {
            if (changesList) {
                if (changesList.added && changesList.added.length > 0) {    
                    for (let key in changesList.added) {
                        csOrdersArray.push(changesList.added[key]);
                        $.tmpl(templates.nOrderCard, changesList.added[key]).appendTo( ".orders-screen" );
                    }
                }
                if (changesList.updated && changesList.updated.length > 0) {
                    for (let xKey in changesList.updated) {
                        for (let yKey in csOrdersArray) {
                            if (changesList.updated[xKey].id === csOrdersArray[yKey].id) {
                                $.each(ordersContainer.find('.order-card'), (index, element) => {
                                    if ($(element).attr('orderid') === csOrdersArray[yKey].id) {
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

                                $.each(ordersContainer.find('.order-card'), (index, element) => {
                                    if ($(element).attr('orderid') === csOrdersArray[yKey].id) { element.remove();}
                                });

                                if (index > -1) { csOrdersArray.splice(index, 1);}
                            }
                        }
                    }
                }
            }
        },
        initOrdersView: (ordersArray) => {
            $.tmpl(templates.nOrderCard, ordersArray).appendTo( ".orders-screen .inner-container .orders-thumbs" );
        },
        attachListeners: () => {
            console.log('Web Socket connection established');

            socket.on('orderBlocked', (data) => {
                uiManager.toggleOrderBlocking(data.orderID, true, data.user.username);
                // [NOTE] Add functionality to show blocking username on the order
            });

            socket.on('orderUnblocked', (orderID) => {
                uiManager.toggleOrderBlocking(orderID, false);
            });

            socket.on('ordersUpdate', (socketMsg) => {
                //@TODO Check on Sequence check functionality
                //dataSet = socketManager.checkSocketMsg(socketMsg);
                dataSet = {status: true, data: socketMsg.data};
                if (dataSet.status) {
                    socketManager.updateOrdersView(dataSet.data);
                }
            });

            socket.on('orderUpdate', (data) => {
                //@TODO Update Single Order 
                console.log('OrderUpdate Event');
                console.log(data);
            });

            socket.on('init', (sckData) => {
                sckId = sckData.sID;
                csOrdersArray = sckData.data;
                socketManager.initOrdersView(sckData.data);
            });

            socket.on('disconnect', () => {
                Qticket.toggleLoadScreen(true);
            });            
        },
        socketConnect: () => {
            socket.on('connect', () => {
                if (!Qticket.isLoadingActive()) {
                    socketManager.attachListeners();
                }else {
                    location.reload();
                }
            });
        },
        // => Init
        init: () => {
            socketManager.socketConnect();
        }
    },
    //===> UI Manager
    uiManager = {
        toggleScreens: (prevEdited) => {
            if (ordersContainer.hasClass(activeClass)) {
                if (prevEdited) {
                    uiDetailScreenManager.toggleOrderActionButtons(true);
                }
                ordersContainer.removeClass(activeClass);
                orderDetailsContainer.addClass(activeClass);
            }else {
                ordersContainer.addClass(activeClass);
                orderDetailsContainer.removeClass(activeClass);
                uiDetailScreenManager.toggleOrderActionButtons(false);
                uiDetailScreenManager.cleanDetailUI();
            }
        },

        toggleOrderBlocking: (id, blockState = true, username = undefined) => {
            $.each(ordersContainer.find('.order-card'), (index, element) => {
                let target = $(element);
                if (target.data('id') === id) {
                    target.toggleClass(blockedClass, blockState);
                }
            });
        },
        ordersUpdate: () => {
            
        },
        attachListeners: () => {
            ordersContainer.on('click', '.order-card', (e) => {
                let target = $(e.currentTarget);

                if (!target.hasClass(blockedClass)) {
                    let data = {id:target.data('id'), order:target.data('ticketNumber'), client: {id: target.data('client-id'),name: target.data('client')}},
                        orderAvailable = socketManager.blockOrder(data.id);

                    orderAvailable.then((orderData) => {
                        if (orderData.orderAvailable) {
                            uiDetailScreenManager.renderOrderInfo(orderData.order);
                        } else {
                            Qticket.throwAlert('Order Blocked');
                        };
                    });
                }else {
                    Qticket.throwAlert('Order Blocked');
                }
            });
        },
        init: () => {
            uiManager.attachListeners();
        }
    },
    //===> Detail Screen Manager
    uiDetailScreenManager = {
        //IO Related functions
        sendOrderData: (data) => {
            return new Promise((resolve, reject) => {
                socket.emit('updateOrder', data, (confirmation) => {
                    resolve(confirmation);
                });
            });
        },
        getOrderProductsArray: () => {
            let orderRows = oDProductsList.find('.order-row'),
                orderRowsArray = [];

                $.each(orderRows, (index, element) => {
                    let row = $(element);

                    orderRowsArray.push({
                        productName: row.find('.product-name').html(),
                        productQty: row.find('.product-price .price').html(),
                        productPrice: row.find('.product-qty .qty').html()
                    });
                });

            return orderRowsArray;
        },
        gatherToStoreOrderData: (ordState) => {
            let orderRowsInfo = uiDetailScreenManager.getOrderProductsArray(),
                orderDataObj ={
                    orderid: currentOrderData.id,
                    orderState: ordState,
                    productRows: orderRowsInfo,
                    activityLog: {
                        user: {
                            odooUserId: Qticket.session.uid,
                            username: Qticket.session.username
                        },
                        date: new Date(), 
                        changeLogs: []
                    }
                };

            return orderDataObj;
        },
        // Validation Methods
        currentRowValid: () => {
            let floatPrice = parseFloat(currentRow.price.html()),
                floatQty = parseFloat(currentRow.qty.html());

                currentRow.price.html(floatPrice);
                currentRow.qty.html(floatQty);

            return (uiDetailScreenManager.validValue(floatPrice, 'precio') && uiDetailScreenManager.validValue(floatQty, 'cantidad')) ? true : false;
        },
        validateUserInput: (nValue, element) => {
            if (override) {
                if (nValue === '.') {
                    element.html('0.');
                } else {
                    element.html(nValue.html());
                }
                override = false;
            } else {
                let currentVal = element.html();

                if (currentVal !== '0') {
                    if ((nValue.html() === '.' && !currentVal.includes('.')) || nValue.html() !== '.') {
                        if (currentVal.length <= 6) {
                            element.html(currentVal + nValue.html());
                        }
                    }
                } else {
                    if (nValue.html() === '.') {
                       element.html(currentVal + nValue.html());
                    } else {
                        element.html(nValue.html());
                    }
                }
            }
        },
        validateUserDelete: function (element) {
            let currentVal = element.html();

            if (currentVal !== '0') {
                if (!override) {
                    if (element.html().length === 1) {
                        element.html(0);
                    } else {
                        element.html(currentVal.slice(0, -1));
                    }
                }else {
                    element.html(0);
                }
            } else {
                uiDetailScreenManager.removeRow(currentRow.element);
            }
        },
        validValue: (value, field) => {
            if(value !== 0) {
                return true;
            } else {
                new Noty({
                    type: 'error',
                    layout: 'topRight',
                    timeout: 2000,
                    text: 'Error en ' + field
                }).show();
                return false;
            }
        },
        validateOrderBeforeSend: () => {
            //Check that orders count with at least one product row
        },
        //UI Related functions
        toggleTabs: () => {
            if ($(mobileTabs[0]).hasClass(activeClass)) {
                $(mobileTabs[0]).removeClass(activeClass);
                $(mobileSections[0]).removeClass(activeClass);
                $(mobileTabs[1]).addClass(activeClass);
                $(mobileSections[1]).addClass(activeClass);
            } else {
                $(mobileTabs[0]).addClass(activeClass);
                $(mobileSections[0]).addClass(activeClass);
                $(mobileTabs[1]).removeClass(activeClass);
                $(mobileSections[1]).removeClass(activeClass);
            }
        },
        renderOrderInfo: (orderData) => {
            let prevEdited;
            currentOrderData = orderData;
            
            clientInfoBar.html(orderData.client[1]);

            if (orderData.orderDBData !== undefined) {
                prevEdited = true;
                //Load Prevoiusly edited products into the list
            } else {
                prevEdited = false;
            }

            uiManager.toggleScreens(prevEdited);
        },
        toggleOrderActionButtons: (activate) => {
            if (activate) {
                saveButton.removeClass(disabledClass);
                doneButton.removeClass(disabledClass);
            } else {
                saveButton.addClass(disabledClass);
                doneButton.addClass(disabledClass);
            }
        },
        resetProductsActionButtons: () => {
            removeModifier.removeClass(disabledClass);
            priceModifier.addClass(disabledClass);
            qtyModifier.removeClass(disabledClass);
        },
        enableActionButtons: () => {
            actionEnabled = true;
            override = true;
            uiDetailScreenManager.resetProductsActionButtons();
        },
        disableActionButtons: () => {
            modifierButtons.addClass(disabledClass);
            writeQueue = '';
            actionEnabled = false;
        },
        getActiveAction: () => {
            return (!priceModifier.hasClass(disabledClass)) ? 'price' : 'qty';
        },
        cleanDetailUI: () => {
            productCards.removeClass(selectedClass);
            uiDetailScreenManager.disableActionButtons;
            clientInfoBar.html('');
            currentRow = {};
            currentOrderData = {};
            oDProductsList.empty();
        },
        leaveDetailScreen: ()=> {
            uiManager.toggleScreens();
        },
        addRow: (card) => {
            if (currentRow.element === undefined || uiDetailScreenManager.currentRowValid()) {
                let nRowInfo = {id: card.attr('data-id'),
                        product: card.attr('data-name'),
                        price: card.attr('data-price')},
                nRow = $.tmpl(templates.row, nRowInfo).appendTo(oDProductsList);
                oDProductsList.scrollTop(oDProductsList.prop('scrollHeight'));
                uiDetailScreenManager.updateCurrentRow(nRow);
                card.addClass(selectedClass);
            }
            if (oDProductsList.find('.row').length > 0 && saveButton.hasClass(disabledClass)) {
                uiDetailScreenManager.toggleOrderActionButtons(true);
            }
        },
        removeRow: () => {
            productsSection.find('.product-card[data-id='+currentRow.element.attr('data-id')+']').removeClass(selectedClass);
            currentRow.element.remove();
            currentRow = {};
            uiDetailScreenManager.disableActionButtons();

            if (oDProductsList.find('.row').length == 0 && !saveButton.hasClass(disabledClass)) {
                uiDetailScreenManager.toggleOrderActionButtons(false);
            }
        },
        updateCurrentRow: function (row) {
            if (currentRow.element !== undefined) {
                 if (uiDetailScreenManager.currentRowValid()) {
                    currentRow.element.removeClass(selectedClass);
                    row.addClass(selectedClass);
                    currentRow.element = row;
                    currentRow.price = row.find('.price');
                    currentRow.qty = row.find('.qty');
                    uiDetailScreenManager.enableActionButtons();
                }
            } else {
                row.addClass(selectedClass);
                currentRow.element = row;
                currentRow.price = row.find('.price');
                currentRow.qty = row.find('.qty');
                uiDetailScreenManager.enableActionButtons();
            }
        },
        attachListeners: () => {
            mobileTabs.on('click', (e) => {
                e.preventDefault();
                if (!$(e.currentTarget).hasClass(activeClass)) {
                    uiDetailScreenManager.toggleTabs();    
                }
            });

            cancelButton.on('click', (e) => {
                let orderUnblocking = socketManager.unBlockOrder(currentOrderData.id);
                
                orderUnblocking.then((confirmation) => {
                    if (confirmation) {
                        uiDetailScreenManager.leaveDetailScreen();
                    } else {
                        Qticket.throwAlert('Error while unlocking order');
                        location.reload();
                    };
                });
            });

            saveButton.on('click', (e) => {
                if (!saveButton.hasClass(disabledClass)) {
                    let sendOrderPrms = uiDetailScreenManager.sendOrderData(uiDetailScreenManager.gatherToStoreOrderData('saved'));
                    
                    sendOrderPrms.then((confirmation) => {
                        if (confirmation) {
                            uiDetailScreenManager.leaveDetailScreen();
                        } else {
                            Qticket.throwAlert('Error Saving order to the database');
                        }
                    }).catch((err) => {
                        console.log(err);
                        Qticket.throwAlert('Error Saving order to the database');
                    });
                }
            });

            doneButton.on('click', (e) => {
                if (!doneButton.hasClass(disabledClass)) {
                    // Done procedure
                }
            });

            removeModifier.on('click', (e) => {
                if (actionEnabled) {
                    if (uiDetailScreenManager.getActiveAction() === 'price') {
                        uiDetailScreenManager.validateUserDelete(currentRow.price);
                    } else {
                        uiDetailScreenManager.validateUserDelete(currentRow.qty);
                    }
                }
            });

            priceModifier.on('click', (e) => {
                if (actionEnabled) {
                    override = true;
                    if (uiDetailScreenManager.getActiveAction() === 'qty') {
                        qtyModifier.addClass(disabledClass);
                        priceModifier.removeClass(disabledClass);
                    }
                }
            });

            qtyModifier.on('click', (e) => {
                if (actionEnabled) {
                    override = true;
                    if (uiDetailScreenManager.getActiveAction() === 'price') {
                        qtyModifier.removeClass(disabledClass);
                        priceModifier.addClass(disabledClass);
                    }
                }
            });

            keyButtons.on('click', (e) => {
                if (actionEnabled && currentRow.element !== undefined) {
                    let target = $(e.currentTarget);

                    if (uiDetailScreenManager.getActiveAction() === 'price') {
                        uiDetailScreenManager.validateUserInput(target, currentRow.price);
                    } else {
                        uiDetailScreenManager.validateUserInput(target, currentRow.qty);
                    }
                }
            });

            oDProductsList.on('click', '.order-row', (e) => {
                if (currentRow.element.attr('data-id') !== $(e.currentTarget).attr('data-id')) {
                    uiDetailScreenManager.updateCurrentRow($(e.currentTarget));
                }
            });

            productCards.on('click', (e) => {
                let card = $(e.currentTarget);
                if (!card.hasClass(selectedClass)) {
                    uiDetailScreenManager.addRow(card);
                }
            });
        },
        init: () => {
            uiDetailScreenManager.attachListeners();
            $(document).ready(() => {
                $('[data-toggle="tooltip"]').tooltip();   
            });
        }
    }
    self = this;
    uiManager.init();
    uiDetailScreenManager.init();
    socketManager.init();
});