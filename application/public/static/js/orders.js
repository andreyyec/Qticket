/*
    @ToREMOVE Debug function
*/

$(function () {
    let self, sckId, csOrdersArray, currentRow = {}, currentOrderData = {}, override = true, actionEnabled = false,
    socket = Qticket.getIOInstance('orders'), body = $('body'), blockedClass = 'blocked', disabledClass = 'disabled', selectedClass = 'selected', activeClass = 'active', doneClass = 'done',
    ordersContainer = body.find('.orders-screen'),
    ordersThumbsContainer = ordersContainer.find('.inner-container .orders-thumbs'),
    ordersFullContainer = ordersContainer.find('.inner-container .orders-full'),
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
    dbActionButtons = oDSection.find('.action-buttons-bar .send'),
    saveButton = oDSection.find('.action-buttons-bar .save'),
    doneButton = oDSection.find('.action-buttons-bar .done'),
    removeModifier = $(modifierButtons[0]),
    priceModifier = $(modifierButtons[1]),
    qtyModifier = $(modifierButtons[2]),
    //===> Templates Object
    templates= {
        nOrderCard: '<div class="col-6 col-sm-4 col-md-3">\
                        <div class="card card-inverse order-card {{if $data.isBlocked}}blocked{{else $data.orderDBData && $data.orderDBData.orderState && $data.orderDBData.orderState == "done"}}done{{/if}}" data-id="${id}" data-client-id="${client[0]}" data-client="${client[1]}" data-ticket="${ticket}">\
                            <div class="card-header card-header">\
                                ${id}\
                            </div>\
                            <div class="card-block bg-white card-body">\
                                <div class="row no-gutters client-info-section">\
                                    <div class="col-8 client">${client[1]}</div>\
                                    <div class="col-4 ticket">{{if (ticket !== undefined) && (ticket !== false)}}${ticket}{{else}}-{{/if}}</div>\
                                </div>\
                                {{if $data.orderDBData}}\
                                    <div class="row no-gutters products-section">\
                                        <div class="col-12">\
                                            {{each(prop, val) orderDBData.productRows}}\
                                                <div class="row no-gutters">\
                                                    <div class="col-12 product-name" data-id="${val.id}">${val.name}</div>\
                                                    <div class="col-6 product-price">&#8353;<span class="value">${val.price}</span></div>\
                                                    <div class="col-6 product-qty"><span class="value">${val.qty}</span>&nbsp;Kg</div>\
                                                </div>\
                                            {{/each}}\
                                        </div>\
                                    </div>\
                                {{/if}}\
                            </div>\
                        </div>\
                    </div>',
        row:    '<div class="order-row" data-id="${id}">\
                    <div class="row inner" >\
                        <div class="col-8 bold product-name">${product}</div>\
                        <div class="col-4 product-price">&cent;<span class="price">${price}</span></div>\
                        <div class="col-12 product-qty">Cantidad: <span class="bold qty">{{if (qty)}}${qty}{{else}}1{{/if}}</span></div>\
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
            return new Promise((resolve, reject) => {
                socket.emit('updateOrder', orderData, (confirmation) => {
                    resolve(confirmation);
                });
            });
        },
        attachListeners: () => {
            console.log('Web Socket connection established');

            socket.on('screenUpdate', (dataArray) => {
                for (let i in dataArray.added) {
                    uiManager.addOrder(dataArray.added[i]);
                }

                for (let i in dataArray.updated) {
                    uiManager.updateOrderById(dataArray.updated[i]);   
                }

                for (let i in dataArray.removed) {
                    uiManager.removeOrderById(dataArray.removed[i]);
                }
            });

            socket.on('orderBlocked', (data) => {
                uiManager.toggleOrderBlocking(data.orderID, true, data.user.username);
                // [NOTE] Add functionality to show blocking username on the order
            });

            socket.on('orderUnblocked', (orderID) => {
                uiManager.toggleOrderBlocking(orderID, false);
            });

            socket.on('orderUpdate', (data) => {
                //@TODO Update Single Order
                let cOrder = ordersContainer.find('.order-card[data-id="'+data.id+'"]').parent(),
                    cOrderSection = cOrder.parent(),
                    nOrder = $.tmpl(templates.nOrderCard, data);

                if (cOrderSection.hasClass('.orders-full')) {
                    cOrder.replaceWith(nOrder);
                } else {
                    cOrder.remove();
                    ordersFullContainer.prepend(nOrder);
                }
            });

            socket.on('init', (ordersArray) => {
                uiManager.initOrdersView(ordersArray);
            });

            socket.on('disconnect', () => {
                Qticket.toggleLoadScreen(true);
            });            
        },
        debug: () => {
            socket.emit('debug', (data) => {
                console.log(data);
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
            Qticket.debug = () => {
                socketManager.debug();
            };
        }
    },
    //===> UI Manager
    uiManager = {
        toggleScreens: () => {
            if (ordersContainer.hasClass(activeClass)) {
                orderDetailsContainer.addClass(activeClass);
                ordersContainer.removeClass(activeClass);
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
        addOrder: (data) => {
            ordersThumbsContainer.prepend($.tmpl(templates.nOrderCard, data));
        },
        updateOrderById: (data) => {
            let cOrder = ordersContainer.find('.order-card[data-id="'+data.id+'"]').parent(),
                cOrderSection = cOrder.parent(),
                nOrder = $.tmpl(templates.nOrderCard, data);

            if (cOrderSection.hasClass('.orders-full')) {
                cOrder.replaceWith(nOrder);
            } else {
                if (data.orderDBData) {
                    cOrder.remove();
                    ordersFullContainer.prepend(nOrder);
                } else {
                    cOrder.replaceWith(nOrder);
                }
            }
        },
        removeOrderById: (id) => {
            return cOrder = ordersContainer.find('.order-card[data-id="'+id+'"]').parent().remove();
        },
        attachListeners: () => {
            ordersContainer.on('click', '.order-card', (e) => {
                let target = $(e.currentTarget);

                if(target.hasClass(blockedClass)) {
                    Qticket.throwAlert('Order Blocked');
                }else if (target.hasClass(doneClass)) {
                    Qticket.throwAlert('Order Closed', 'success');
                }else {    
                    let data = {id:target.data('id'), order:target.data('ticketNumber'), client: {id: target.data('client-id'),name: target.data('client')}},
                        orderAvailable = socketManager.blockOrder(data.id);

                    orderAvailable.then((orderData) => {
                        if (orderData.orderAvailable) {
                            uiDetailScreenManager.renderOrderInfo(orderData.order);
                        } else {
                            Qticket.throwAlert('Order Blocked');
                        };
                    });
                
                    
                }
            });
        },
        initOrdersView: (ordersArray) => {
            let thumbOrdersArray = ordersArray.filter(x => x.orderDBData === undefined),
                fullOrdersArray = ordersArray.filter(x => x.orderDBData !== undefined);

            $.tmpl(templates.nOrderCard, thumbOrdersArray).appendTo(ordersThumbsContainer);
            $.tmpl(templates.nOrderCard, fullOrdersArray).appendTo(ordersFullContainer);
        },
        init: () => {
            uiManager.attachListeners();
        }
    },
    //===> Detail Screen Manager
    uiDetailScreenManager = {
        //IO Related functions
        sendOrderData: (data) => {
            return socketManager.updateOrder(data);
        },
        getOrderProductsArray: () => {
            let orderRows = oDProductsList.find('.order-row'),
                orderRowsArray = [];

                $.each(orderRows, (index, element) => {
                    let row = $(element);

                    orderRowsArray.push({
                        id: row.data('id'),
                        name: row.find('.product-name').html(),
                        price: row.find('.product-price .price').html(),
                        qty: row.find('.product-qty .qty').html()
                    });
                });

            return orderRowsArray;
        },
        gatherToStoreOrderData: (ordState) => {
            let orderRowsInfo = uiDetailScreenManager.getOrderProductsArray(),
                orderDataObj ={
                    orderid: (currentOrderData.id !== undefined) ? currentOrderData.id : 0,
                    orderState: ordState,
                    productRows: orderRowsInfo,
                    activityLog: {
                        user: {
                            odooUserId: Qticket.session.uid,
                            username: Qticket.session.username
                        }
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
                currentRow = {};
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
            let nRow, productsArray;

            currentOrderData = orderData;
            clientInfoBar.html(orderData.client[1]);

            if (orderData.orderDBData !== undefined) {
                productsArray = orderData.orderDBData.productRows;

                for(let i in productsArray) {
                    let cProd, nRowInfo;

                    nRowInfo = {
                            id: productsArray[i].id,
                            product: productsArray[i].name,
                            price: productsArray[i].price,
                            qty: productsArray[i].qty};
                    
                    cProd = productsSection.find('.product-card[data-id="'+productsArray[i].id+'"]');
                    if (cProd) {cProd.addClass(selectedClass);}
                    nRow = $.tmpl(templates.row, nRowInfo).appendTo(oDProductsList);
                }
                uiDetailScreenManager.updateCurrentRow(nRow);
                //Load Prevoiusly edited products into the list
            }

            uiManager.toggleScreens();
        },
        toggleOrderActionButtons: (activate) => {
            if (activate) {
                dbActionButtons.removeClass(disabledClass);
            } else {
                dbActionButtons.addClass(disabledClass);
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
                let nRowInfo = {
                        id: card.data('id'),
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
            }else if (oDProductsList.find('.row').length > 0 && saveButton.hasClass(disabledClass)){
                uiDetailScreenManager.toggleOrderActionButtons(true);
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
                        currentRow = {};
                        uiDetailScreenManager.leaveDetailScreen();
                    } else {
                        Qticket.throwAlert('Error while unlocking order');
                        location.reload();
                    };
                });
            });

            dbActionButtons.on('click', (e) => {
                let button = $(e.target),
                    orderState = (button.hasClass('done')?'done':'saved');

                if (!button.hasClass(disabledClass)) {
                    let sendOrderPrms = uiDetailScreenManager.sendOrderData(uiDetailScreenManager.gatherToStoreOrderData(orderState));
                    
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
                if (!$.isEmptyObject(currentRow) && (currentRow.element.attr('data-id') !== $(e.currentTarget).attr('data-id'))) {
                    uiDetailScreenManager.updateCurrentRow($(e.currentTarget));
                } else {
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