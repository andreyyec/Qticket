$(function () {
    const socket = Qticket.getIOInstance('orders'), body = $('body'), blockedClass = 'blocked', disabledClass = 'disabled', selectedClass = 'selected', activeClass = 'active', doneClass = 'done',
        ordersContainer = body.find('.orders-screen .inner-container '),
        ordersThumbsContainer = ordersContainer.find('.page-body .to'),
        ordersFullContainer = ordersContainer.find('.page-body .from'),
        pageHeader = body.find('.header-wrapper'),
        fromOrderPanel = pageHeader.find('.from'),
        toOrderPanel = pageHeader.find('.to'),
        transferBtn = pageHeader.find('.transfer')
        templates= {
            nOrderCard: 
                '<div class="col-12 col-sm-6">\
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
                </div>'
        };

    let self, fromOrder, fromOrderBBM = false, toOrder, toOrderBBM = false;
    
    //===> Socket Manager
    const socketManager = {
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
        transferOrder: (fromOrderId, toOrderId) => {
            return new Promise((resolve, reject) => {
                socket.emit('transferOrder', {from: fromOrderId, to: toOrderId, userData: {uId:Qticket.session.uid, uName:Qticket.session.username}}, (confirmation) => {
                    resolve(true); //@TODO
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

                if (cOrderSection.hasClass('.from')) {
                    cOrder.replaceWith(nOrder);
                } else {
                    cOrder.remove();
                    ordersFullContainer.prepend(nOrder);
                }
            });

            socket.on('init', () => {
                socket.emit('initCashierRequest', (data) => {
                	if (!data.err) {
                		 uiManager.initOrdersView(data);
                	} else {
                		Qticket.throwAlert('Error while getting orders list');
                	}
                });
            });

			socket.on('chashierInit', (ordersArray) => {
                uiManager.initOrdersView(ordersArray);
            });


            socket.on('disconnect', () => {
                Qticket.toggleLoadScreen(true);
            });            
        },
        socketConnect: () => {
            socket.on('connect',  () => {
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
        enableDataTransferBtn: () => {
            if (fromOrder && toOrder) {
                transferBtn.removeClass(disabledClass);
                window.Qticket.scrolltop(body);
            } else {
                transferBtn.addClass(disabledClass);
            }
        },
        clearTicketData: (prevSaved) => {
            if (prevSaved) {
                fromOrder = undefined;
                fromOrderBBM = false;
                uiManager.toggleTransferModuleData(prevSaved);
            } else {
                socketManager.unBlockOrder(toOrder.data.id);
                toOrder = undefined;
                toOrderBBM = false;
                uiManager.toggleTransferModuleData(prevSaved);
            }
        },
        toggleTransferModuleData: (prevSaved, id) => {
            if (prevSaved) {
                if (id) {
                    fromOrderPanel.html(id);
                } else {
                    fromOrderPanel.html('');
                }
            } else {
                if (id) {
                    toOrderPanel.html(id);
                } else {
                    toOrderPanel.html('');
                }
            }
            uiManager.enableDataTransferBtn();
        },
        toggleTransferBtn: () => {
            if (fromOrderPanel.html() !== '' && toOrderPanel.html() !== '') {
                transferBtn.removeClass('disabled');
            } else {
                transfer.addClass('disabled');
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

            if (cOrderSection.hasClass('.from')) {
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
        initOrdersView: (ordersArray) => {
            let thumbOrdersArray = ordersArray.filter(x => x.orderDBData === undefined),
                fullOrdersArray = ordersArray.filter(x => x.orderDBData !== undefined);

            $.tmpl(templates.nOrderCard, thumbOrdersArray).appendTo(ordersThumbsContainer);
            $.tmpl(templates.nOrderCard, fullOrdersArray).appendTo(ordersFullContainer);
        },
        attachListeners() {
            socket.on('orderBlocked', (data) => {
                uiManager.toggleOrderBlocking(data.orderID, true, data.user.username);
            });

            socket.on('orderUnblocked', (orderID) => {
                uiManager.toggleOrderBlocking(orderID, false);
            });

            transferBtn.on('click', () => {
                if (!$(this).hasClass(disabledClass)) {
                    let transferOrderPromise = socketManager.transferOrder(fromOrder.data.id, toOrder.data.id);

                    transferOrderPromise.then((success) => {
                        if (!success) {
                            Qticket.throwAlert('Transfer Error');
                        }
                    });
                }
            });

            ordersContainer.on('click', '.order-card', (e) => {
                let target = $(e.currentTarget),
                    prevSaved = target.closest('.order-section').hasClass('from');                

                if (prevSaved) {
                    if (target.hasClass(blockedClass)) {
                        if (fromOrderBBM) {
                            if (fromOrderBBM !== target.data('id')) {
                                Qticket.throwAlert('Order Blocked');
                            } else {
                                target.removeClass(blockedClass);
                                uiManager.clearTicketData(prevSaved);
                            }
                        } else {
                            Qticket.throwAlert('Order Blocked');
                        }
                    } else {
                        if (fromOrder) {
                            fromOrder.target.removeClass(blockedClass);
                            uiManager.clearTicketData(prevSaved);
                        }
                        let data = {id:target.data('id'), order:target.data('ticketNumber'), client: {id: target.data('client-id'),name: target.data('client')}};
                        
                        target.addClass(blockedClass);
                        fromOrderBBM = data.id;
                        fromOrder = {data: data, target: target};
                        uiManager.toggleTransferModuleData(prevSaved, data.id);
                    }
                } else {
                    if (target.hasClass(blockedClass)) {
                        if (toOrderBBM) {
                            if (toOrderBBM !== target.data('id')) {
                                Qticket.throwAlert('Order Blocked');
                            }
                            uiManager.clearTicketData(prevSaved);
                        } else {
                            Qticket.throwAlert('Order Blocked');
                        }
                    } else {
                        if (toOrder) {
                            uiManager.clearTicketData(prevSaved);
                        }
                        let data = {id:target.data('id'), order:target.data('ticketNumber'), client: {id: target.data('client-id'),name: target.data('client')}},
                        orderAvailable = socketManager.blockOrder(data.id);

                        orderAvailable.then((orderData) => {
                            if (!orderData.orderAvailable) {
                                Qticket.throwAlert('Order Blocked');
                            } else {
                                target.addClass(blockedClass);
                                toOrderBBM = data.id;
                                toOrder = {data: data, target: target};
                                uiManager.toggleTransferModuleData(prevSaved, data.id);
                            }
                        });
                    }
                }
            });
        },
        init: () => {
            uiManager.attachListeners();
        }
    };

    self = this;
    socketManager.init();
    uiManager.init();

});