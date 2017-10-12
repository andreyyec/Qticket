$(function () {
    let self, sckId, csOrdersArray, currentRow = {}, override = true, actionEnabled = false,
    socket = io(),
    body = $('body'),
    disabledClass = 'disabled',
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
    keyButtons = oDKeypad.find('.key'),
    removeModifier = $(modifierButtons[0]),
    priceModifier = $(modifierButtons[1]),
    qtyModifier = $(modifierButtons[2]),
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
                        <div class="col-4 product-price">&cent;<span class="price">${price}</span></div>\
                        <div class="col-12 product-qty">Cantidad: <span class="bold qty">1</span></div>\
                    </div>\
                </div>'
    },
    uiManager = {
        resetActionButtons: function () {
            removeModifier.removeClass(disabledClass);
            priceModifier.addClass(disabledClass);
            qtyModifier.removeClass(disabledClass);
        },
        enableActionButtons: function() {
            actionEnabled = true;
            override = true;
            uiManager.resetActionButtons();
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
            uiManager.disableActionButtons;
            currentRow = {};
            oDProductsList.empty();
        },
        addRow: function(card) {
            if (currentRow.element === undefined || uiManager.currentRowValid()) {
                let nRowInfo = {id: card.attr('data-id'),
                        product: card.attr('data-name'),
                        price: card.attr('data-price')},
                nRow = $.tmpl(templates.row, nRowInfo).appendTo(oDProductsList);
                oDProductsList.scrollTop(oDProductsList.prop('scrollHeight'));
                uiManager.updateCurrentRow(nRow);
                card.addClass(selectedClass);
            }
        },
        removeRow: function() {
            productsSection.find('.product-card[data-id='+currentRow.element.attr('data-id')+']').removeClass(selectedClass);
            currentRow.element.remove();
            currentRow = {};
            uiManager.disableActionButtons();
            uiManager.cleanDetailUI();
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

            return (uiManager.validValue(floatPrice, 'precio') && uiManager.validValue(floatQty, 'cantidad')) ? true : false;
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
                uiManager.removeRow(currentRow.element);
            }
        },
        updateCurrentRow: function (row) {
            if (currentRow.element !== undefined) {
                 if (uiManager.currentRowValid()) {
                    currentRow.element.removeClass(selectedClass);
                    row.addClass(selectedClass);
                    currentRow.element = row;
                    currentRow.price = row.find('.price');
                    currentRow.qty = row.find('.qty');
                    uiManager.enableActionButtons();
                }
            } else {
                row.addClass(selectedClass);
                currentRow.element = row;
                currentRow.price = row.find('.price');
                currentRow.qty = row.find('.qty');
                uiManager.enableActionButtons();
            }
        },
        attachListeners: function() {
            removeModifier.on('click', function(e) {
                if (actionEnabled) {
                    if (uiManager.getActiveAction() === 'price') {
                        uiManager.validateUserDelete(currentRow.price);
                    } else {
                        uiManager.validateUserDelete(currentRow.qty);
                    }
                }
            });

            priceModifier.on('click', function(e) {
                if (actionEnabled) {
                    override = true;
                    if (uiManager.getActiveAction() === 'qty') {
                        qtyModifier.addClass(disabledClass);
                        priceModifier.removeClass(disabledClass);
                    }
                }
            });

            qtyModifier.on('click', function(e) {
                if (actionEnabled) {
                    override = true;
                    if (uiManager.getActiveAction() === 'price') {
                        qtyModifier.removeClass(disabledClass);
                        priceModifier.addClass(disabledClass);
                    }
                }
            });

            keyButtons.on('click', function(e) {
                if (actionEnabled && currentRow.element !== undefined) {
                    let target = $(e.currentTarget);

                    if (uiManager.getActiveAction() === 'price') {
                        uiManager.validateUserInput(target, currentRow.price);
                    } else {
                        uiManager.validateUserInput(target, currentRow.qty);
                    }
                }
            });

            oDProductsList.on('click', '.order-row', function(e) {
                if (currentRow.element.attr('data-id') !== $(e.currentTarget).attr('data-id')) {
                    uiManager.updateCurrentRow($(e.currentTarget));
                }
            });

            productCards.on('click', function(e) {
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