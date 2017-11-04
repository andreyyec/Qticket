$(function () {
    let self, sckId, csOrdersArray, currentRow = {}, currentOrderData = {}, override = true, actionEnabled = false,
    socket = Qticket.getIOInstance('orders'), body = $('body'), disabledClass = 'disabled', selectedClass = 'selected', activeClass = 'active',
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
    removeModifier = $(modifierButtons[0]),
    priceModifier = $(modifierButtons[1]),
    qtyModifier = $(modifierButtons[2]),
    templates= {
        nOrderCard: '<div class="col-6 col-sm-4 col-md-3">\
                        <div class="card card-primary card-inverse order-card" data-id="${id}" data-client-id="${client[0]}" data-client="${client[1]}" data-ticket="${ticket}">\
                            <div class="card-header card-primary card-header">\
                                ${id}\
                            </div>\
                            <div class="card-block bg-white card-body">\
                                <div class="ticket">{{if (ticket !== false)}}${ticket}{{else}}-{{/if}}</div>\
                                <div class="client">${client[1]}</div>\
                            </div>\
                        </div>\
                    </div>',
        orderCard: '<div class="col-xs-6 col-sm-4 col-md-3 order-card" orderid="${id}">\
                        <div class="panel panel-primary">\
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
    uiManager = {
        toggleScreens: function() {
            if (ordersContainer.hasClass(activeClass)) {
                ordersContainer.removeClass(activeClass);
                orderDetailsContainer.addClass(activeClass);
            }else {
                ordersContainer.addClass(activeClass);
                orderDetailsContainer.removeClass(activeClass);
            }
        },
        attachListeners: function() {
            ordersContainer.on('click', '.order-card', function(e) {
                let target = $(e.currentTarget),
                    data = {id:target.data('id'), order:target.data('ticket'), client: {id: target.data('client-id'),name: target.data('client')}};
                uiDetailScreenManager.loadInfoData(data);
                uiManager.toggleScreens();
            });
        },
        init: function() {
            uiManager.attachListeners();
        }
    },
    uiDetailScreenManager = {
        toggleTabs: function() {
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
        loadInfoData: function(data) {
            currentOrderData = data;
            clientInfoBar.html(data.client.name);
        },
        resetActionButtons: function() {
            removeModifier.removeClass(disabledClass);
            priceModifier.addClass(disabledClass);
            qtyModifier.removeClass(disabledClass);
        },
        enableActionButtons: function() {
            actionEnabled = true;
            override = true;
            uiDetailScreenManager.resetActionButtons();
        },
        disableActionButtons: function() {
            modifierButtons.addClass(disabledClass);
            writeQueue = '';
            actionEnabled = false;
        },
        getActiveAction: function() {
            return (!priceModifier.hasClass(disabledClass)) ? 'price' : 'qty';
        },
        cleanDetailUI: function() {
            productCards.removeClass(selectedClass);
            uiDetailScreenManager.disableActionButtons;
            clientInfoBar.html('');
            currentRow = {};
            currentOrderData = {};
            oDProductsList.empty();
        },
        addRow: function(card) {
            if (currentRow.element === undefined || uiDetailScreenManager.currentRowValid()) {
                let nRowInfo = {id: card.attr('data-id'),
                        product: card.attr('data-name'),
                        price: card.attr('data-price')},
                nRow = $.tmpl(templates.row, nRowInfo).appendTo(oDProductsList);
                oDProductsList.scrollTop(oDProductsList.prop('scrollHeight'));
                uiDetailScreenManager.updateCurrentRow(nRow);
                card.addClass(selectedClass);
            }
        },
        removeRow: function() {
            productsSection.find('.product-card[data-id='+currentRow.element.attr('data-id')+']').removeClass(selectedClass);
            currentRow.element.remove();
            currentRow = {};
            uiDetailScreenManager.disableActionButtons();
            // Clean UI Test @ToRemove
            //uiDetailScreenManager.cleanDetailUI();
        },
        validValue: function(value, field) {
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
        currentRowValid: function() {
            let floatPrice = parseFloat(currentRow.price.html()),
                floatQty = parseFloat(currentRow.qty.html());

                currentRow.price.html(floatPrice);
                currentRow.qty.html(floatQty);

            return (uiDetailScreenManager.validValue(floatPrice, 'precio') && uiDetailScreenManager.validValue(floatQty, 'cantidad')) ? true : false;
        },
        validateUserInput: function(nValue, element) {
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
        attachListeners: function() {
            mobileTabs.on('click', function(e) {
                e.preventDefault();
                if (!$(e.currentTarget).hasClass(activeClass)) {
                    uiDetailScreenManager.toggleTabs();    
                }
            });

            cancelButton.on('click', function(e) {
                uiDetailScreenManager.cleanDetailUI();
                uiManager.toggleScreens();
            });

            saveButton.on('click', function(e) {
                console.log('save Event');
            });

            removeModifier.on('click', function(e) {
                if (actionEnabled) {
                    if (uiDetailScreenManager.getActiveAction() === 'price') {
                        uiDetailScreenManager.validateUserDelete(currentRow.price);
                    } else {
                        uiDetailScreenManager.validateUserDelete(currentRow.qty);
                    }
                }
            });

            priceModifier.on('click', function(e) {
                if (actionEnabled) {
                    override = true;
                    if (uiDetailScreenManager.getActiveAction() === 'qty') {
                        qtyModifier.addClass(disabledClass);
                        priceModifier.removeClass(disabledClass);
                    }
                }
            });

            qtyModifier.on('click', function(e) {
                if (actionEnabled) {
                    override = true;
                    if (uiDetailScreenManager.getActiveAction() === 'price') {
                        qtyModifier.removeClass(disabledClass);
                        priceModifier.addClass(disabledClass);
                    }
                }
            });

            keyButtons.on('click', function(e) {
                if (actionEnabled && currentRow.element !== undefined) {
                    let target = $(e.currentTarget);

                    if (uiDetailScreenManager.getActiveAction() === 'price') {
                        uiDetailScreenManager.validateUserInput(target, currentRow.price);
                    } else {
                        uiDetailScreenManager.validateUserInput(target, currentRow.qty);
                    }
                }
            });

            oDProductsList.on('click', '.order-row', function(e) {
                if (currentRow.element.attr('data-id') !== $(e.currentTarget).attr('data-id')) {
                    uiDetailScreenManager.updateCurrentRow($(e.currentTarget));
                }
            });

            productCards.on('click', function(e) {
                let card = $(e.currentTarget);
                if (!card.hasClass(selectedClass)) {
                    uiDetailScreenManager.addRow(card);
                }
            });
        },
        init: function() {
            uiDetailScreenManager.attachListeners();
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
                        $.tmpl(templates.nOrderCard, changesList.added[key]).appendTo( ".orders-screen" );
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
            $.tmpl(templates.nOrderCard, ordersArray).appendTo( ".orders-screen .inner-container .orders-thumbs" );
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
            socketManager.attachListeners();
        }
    }
    self = this;
    uiManager.init();
    uiDetailScreenManager.init();
    socketManager.init();
});