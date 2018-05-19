$(function () {
    const socket = Qticket.getIOInstance('orders'), body = $('body'), hideClass = 'hide', blockedClass = 'blocked', disabledClass = 'disabled', selectedClass = 'selected', activeClass = 'active', doneClass = 'done',
        user = {id: Qticket.session.uid, username:Qticket.session.username, role: Qticket.session.role, displayName: Qticket.session.displayname},
        ordersContainer = body.find('.orders-screen'),
        ordersHeader = ordersContainer.find('.page-header'),
        ordersBody = ordersContainer.find('.page-body'),
        panelInfoFrom = ordersHeader.find('.from'),
        panelInfoTo = ordersHeader.find('.to'),
        transferBtn = ordersHeader.find('.transfer'),
        ordersThumbsContainer = ordersBody.find('.order-section.from'),
        ordersFullContainer = ordersBody.find('.order-section.to'),
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
        templates= {
            orderCard: '<div class="col-12 col-md-6">\
                            <div class="card card-inverse order-card ${state} {{if blocked}}blocked{{/if}}" data-id="${id}" data-client-id="${client.id}" data-client="${client.name}" data-ticket="${ticket}">\
                                <div class="card-header card-header">\
                                    ${id}\
                                </div>\
                                <div class="card-block bg-white card-body">\
                                    <div class="row no-gutters client-info-section">\
                                        <div class="col-8 client">${client.name}</div>\
                                        <div class="col-4 ticket">{{if (ticket !== undefined) && (ticket !== false)}}${ticket}{{else}}-{{/if}}</div>\
                                    </div>\
                                    {{if $data.productRows}}\
                                        <div class="row no-gutters products-section">\
                                            <div class="col-12">\
                                                {{each(prop, val) productRows}}\
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
                                <div class="card-block user-block-info {{if !$data.blocked}}hide{{/if}}">\
                                        <div class="blocked-by"><small>Blocked by:</small></div>\
                                        <div class="blocker">{{if $data.blocked}}${blocked.displayName}{{/if}}</div>\
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
        };

    let self, currentRow = {}, currentOrderData = {}, override = true, actionEnabled = false;
    
    //===> Socket Manager
    const socketManager = {
        blockOrder: (orderId) => {
            return new Promise((resolve, reject) => {
                socket.emit('blockOrder', {orderId: orderId, user: user}, (confirmation) => {
                    resolve(confirmation);
                });
            });
        },
        unBlockOrder: (orderId) => {
            return new Promise((resolve, reject) => {
                socket.emit('unblockOrder', {orderId: orderId, user: user}, (confirmation) => {
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
                uiManager.toggleOrderBlocking(data.orderId, true, data.user);
            });

            socket.on('orderUnblocked', (orderID) => {
                uiManager.toggleOrderBlocking(orderID, false);
            });

            socket.on('orderUpdated', (data) => {
                let cOrder = ordersContainer.find('.order-card[data-id="'+data.id+'"]').parent(),
                    cOrderSection = cOrder.parent(),
                    nOrder = $.tmpl(templates.orderCard, data);

                if (cOrderSection.hasClass('.orders-full')) {
                    cOrder.replaceWith(nOrder);
                } else {
                    cOrder.remove();
                    ordersFullContainer.prepend(nOrder);
                }
            });

            socket.on('init', (ordersArray) => {
                socket.emit('pullDailyCancelledOrders', (dailyCancelledOrders) => {
                    if(dailyCancelledOrders) {
                        uiManager._initOrdersView(uiManager._filterOrdersObject(ordersArray), dailyCancelledOrders);
                    } else {
                        //@here
                        //Display message that no cancelled orders were found
                    }    
                });
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
        _toggleScreens: (prevSaved = false) => {
            if (ordersContainer.hasClass(activeClass)) {
                orderDetailsContainer.addClass(activeClass);
                ordersContainer.removeClass(activeClass);
                uiDetailScreenManager.toggleOrderActionButtons(false, prevSaved);
            }else {
                ordersContainer.addClass(activeClass);
                orderDetailsContainer.removeClass(activeClass);
                uiDetailScreenManager.toggleOrderActionButtons(false,);
                uiDetailScreenManager.cleanDetailUI();
            }
        },

        toggleOrderBlocking: (orderId, blockState = true, user = undefined) => {
            let target = ordersContainer.find('.order-card[data-id="'+orderId+'"]'),
                blockSec = target.find('.user-block-info'),
                blocker = blockSec.find('.blocker');

            if (blockState === true) {
                blocker.html(user.displayName);
                blockSec.removeClass(hideClass);
            } else {
                blocker.html('');
                blockSec.addClass(hideClass);
            }
            target.toggleClass(blockedClass, blockState);
        },
        addOrder: (data) => {
            ordersThumbsContainer.prepend($.tmpl(templates.orderCard, data));
        },
        updateOrderById: (data) => {
            let cOrder = ordersContainer.find('.order-card[data-id="'+data.id+'"]').parent(),
                cOrderSection = cOrder.parent(),
                nOrder = $.tmpl(templates.orderCard, data);

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
            ordersContainer.find('.order-card[data-id="'+id+'"]').parent().remove();
        },
        _filterOrdersObject(ordsObject) {
            let filteredObjectsArray = [];

            ordsObject = Object.values(ordsObject);

            for(cObj of ordsObject) {
                if (cObj.state !== 'canceled' && cObj.state !== 'closed') {
                    filteredObjectsArray.push(cObj);
                }
            }
            
            return filteredObjectsArray;
        },
        _blockOrder: async (target) => {
            try{
                let blockStatus = await socketManager.blockOrder(target.data('id'));
    
                if (blockStatus === false) {
                    Qticket.throwAlert('Order Blocked');
                };

                return blockStatus;
            } catch(err) {
                console.log('Error while trying to block order');
                console.log(err);
            }
        },
        _unblockOrder: async (target) => {
            try{
                let unblockStatus = await socketManager.unBlockOrder(target.data('id'));
    
                if (unblockStatus === false) {
                    Qticket.throwAlert('Unable to unblock');
                };

                return unblockStatus;
            } catch(err) {
                console.log('Error while trying to unblock order');
                console.log(err);
            }
        },
        _togglePanelInfo: (display, section, data) => {
            if (display) {
                section.html(data);
            } else {
                section.html('');
            }

            uiManager._toggleTransferButton();
        },
        _toggleTransferButton: () => {
            if (panelInfoFrom.html() !== '' && panelInfoTo.html() !== '') {
                transferBtn.removeClass('disabled');
            } else {
                transferBtn.addClass('disabled');
            }
        },
        _attachListeners: () => {
            ordersContainer.on('click', '.order-card', (e) => {
                let conf, cClass, cSelectedElement, displaySection,
                    target = $(e.currentTarget),
                    blocker = target.find('.blocker').html(),
                    sessionUser = Qticket.session.displayname;

                if(target.hasClass(blockedClass) && blocker !== sessionUser) {
                    Qticket.throwAlert('Order Blocked');
                } else {
                    if(target.hasClass('canceled')) {
                        cClass = selectedClass;
                        cIndexElement = 'cancelledSelectedElement';
                        displaySection = panelInfoFrom;
                    } else {
                        cClass = blockedClass;
                        cIndexElement = 'blockedSelectedElement';
                        displaySection = panelInfoTo;
                    }

                    if (target.hasClass(cClass)) {
                        conf = uiManager._unblockOrder(target);
                        if(conf) {
                            target.removeClass(cClass);
                            this[cIndexElement] = undefined;
                            uiManager._togglePanelInfo(false, displaySection);
                        }
                    } else {
                        if(this[cIndexElement] !== undefined) {
                            conf = uiManager._unblockOrder(this[cIndexElement]);
                            if(conf) {
                                this[cIndexElement].removeClass(cClass);
                                uiManager._togglePanelInfo(false, displaySection);
                            }
                        }
                        conf = uiManager._blockOrder(target);
                        if(conf) {
                            target.addClass(cClass);
                            this[cIndexElement] = target;
                            uiManager._togglePanelInfo(true, displaySection, target.data('id'));
                        }
                    }
                }
            });
        },
        _initOrdersView: (validOrders, cancelledOrders) => {
            $.tmpl(templates.orderCard, cancelledOrders).appendTo(ordersThumbsContainer);
            $.tmpl(templates.orderCard, validOrders).appendTo(ordersFullContainer);
        },
        init: () => {
            uiManager._attachListeners();
        }
    };

    self = this;
    uiManager.init();
    socketManager.init();
});