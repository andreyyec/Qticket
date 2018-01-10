/*
@TODO
JS to load, update and validate cashier process
*/

$(function () {
    const socket = Qticket.getIOInstance('orders'), body = $('body'), blockedClass = 'blocked', disabledClass = 'disabled', selectedClass = 'selected', activeClass = 'active', doneClass = 'done',
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
        };

    let self;
    
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

                if (cOrderSection.hasClass('.orders-full')) {
                    cOrder.replaceWith(nOrder);
                } else {
                    cOrder.remove();
                    ordersFullContainer.prepend(nOrder);
                }
            });

            socket.on('init', () => {
                socket.emit('initCashierRequest', (data) => {
                	console.log(data);
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
        initOrdersView: (ordersArray) => {
            let thumbOrdersArray = ordersArray.filter(x => x.orderDBData === undefined),
                fullOrdersArray = ordersArray.filter(x => x.orderDBData !== undefined);

            $.tmpl(templates.nOrderCard, thumbOrdersArray).appendTo(ordersThumbsContainer);
            $.tmpl(templates.nOrderCard, fullOrdersArray).appendTo(ordersFullContainer);
        },
    };

    self = this;
    socketManager.init();
});