const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        dbMng = require(constants.paths.models + 'DBManager'),
        http = require('http'),
        request = require('request');

let self, io, cookie, ordersArray = [], sckId;

class OrdersManager {

    constructor(session, ioInstance) {
        self = this;
        io = ioInstance;
        cookie = request.cookie('session_id='+session.session_id);
        sckId = 1;
    }

    attachIOListeners() {
        //Web Socket Settings
        io.on('connection', function(socket){
            socket.emit('ordersFullUpdate', ordersArray);
        });

        io.on('newOrder', (orderID) => {
            //@TODO: Validation, DB save, then event
            socket.emit('newOrderEvent', orderID);
        });

        io.on('deleteOrder', (orderID) => {
            //@TODO: Validation, DB save, then event
            socket.emit('deleteOrderEvent', orderID);
        });

        io.on('updateOrder', (orderInfo) => {
            let changesObj = {'new': [], 'deleted':[]};

            //io.emit('updateOrder', )
        });
    }

    getSocketMessage(data) {
        sckId ++;
        return {sID: sckId, data: data};
    }

    getIdslist() {
        let idsArray = [];

        for (let key in ordersArray) {
            idsArray.push(ordersArray[key].id);    
        }

        return idsArray;
    }

    updateAppPurchasesList(changesList) {
        if (changesList) {
            let updateFlag = false;
            if (changesList.added && changesList.added.length > 0) {    
                for (let key in changesList.added) {
                    ordersArray.push(changesList.added[key])
                }
                updateFlag = true;
            }
            if (changesList.removed && changesList.removed.length > 0) {
                for (let xKey in changesList.removed) {
                    for (let yKey in ordersArray) {
                        if (changesList.removed[xKey] === ordersArray[yKey].id) {
                            let index = ordersArray.indexOf(ordersArray[yKey]);
                            if (index > -1) {
                                ordersArray.splice(index, 1);
                            }

                            delete ordersArray[yKey];
                        }
                    }
                }
                updateFlag = true;
            }
            if (updateFlag) {
                io.emit('updateOrders', ordersArray);
            }    
        } else {
            console.log('Odoo data wasn\'t received');
        }        
    }

    requestOrderList() {
        return new Promise((resolve, reject) => {
            let restServPath = '/rest/purchases/drafts/list',
                idsArray = self.getIdslist(),
                opts = {
                    url : odooSettings.protocol+'://'+odooSettings.host+':'+odooSettings.port + restServPath,
                    method: 'post',
  					json: true,
                    headers: {
                        Cookie: cookie
                    },
                    body: {
					    params: {
					        ids: {
					        	ids: idsArray
					        },
					    }
                    }
                };

            request(opts, function (error, response, body) {
                if (error === null) {
                    resolve(body.result);
                } else {
                    reject();
                }
            });
        });
    }

    requestProcedure() {
        let getDraftsList = self.requestOrderList();

        getDraftsList.then((data) => {
            self.updateAppPurchasesList(JSON.parse(data));
        })
        .catch((data) => {
             console.log('Error while trying to get purchases list');
        }); 
    }

    initLoop() {
        self.requestProcedure();
        self.attachIOListeners();

        setInterval(() => {
            self.requestProcedure();
        }, constants.appSettings.purchaseListRefreshTime);
    }
}

module.exports = OrdersManager;