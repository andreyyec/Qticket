const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        dbMng = require(constants.paths.models + 'DBManager'),
        http = require('http'),
        request = require('request');

let self, ioOrders, ioDashb, ioDashboardInstance, cookie, sckId, 
    ordersObj = {'drafts': [], 'approved': [], 'confirmed': []};

class OrdersManager {

    constructor(session, ioOrdersInstance, ioDashbInstance) {
        self = this;
        ioOrders = ioOrdersInstance;
        ioDashb = ioDashbInstance;
        cookie = request.cookie('session_id='+session.session_id);
        sckId = 0;
    }

    attachIOListeners() {
        //Dashboard Web Socket
        ioDashb.on('connection', function(socket) {
            socket.emit('connect');

            socket.on('request', function(data) {
                socket.emit('data', ordersObj);
            });
        });

        //Orders Web Socket
        ioOrders.on('connection', function(socket){
            socket.emit('init', {sID: sckId, data: ordersObj.drafts});

            socket.on('blockOrder', (orderID) => {
                //@TODO: Validation, DB save, then event
                socket.emit('orderBlocked', orderID);
            });

            socket.on('deleteOrder', (orderID) => {
                //@TODO: Validation, DB save, then event
                socket.emit('deleteOrderEvent', orderID);
            });

            socket.on('updateOrder', (orderInfo) => {
                let changesObj = {'new': [], 'deleted':[]};

                //ioOrders.emit('updateOrder', )
            });
        });
    }

    getSocketMessage(data) {
        sckId ++;
        return {sID: sckId, data: data};
    }

    getIdsObj() {
        let section, idsObj = {};

        for (let sectInd in ordersObj) {
            section = ordersObj[sectInd];
            idsObj[sectInd] = new Array();

            for (let doc in section) {
                idsObj[sectInd].push({id:section[doc].id, last_update:section[doc].last_update});    
            }
        }
        return idsObj;
    }

    updateList(changesList, updatesArray, checkForUpdated = false) {
        let /*updatesArray = [],*/ updateFlag = false;

        if (changesList) {
            if (changesList.added && changesList.added.length > 0) {    
                for (let key in changesList.added) {
                    updatesArray.push(changesList.added[key])
                }
                updateFlag = true;
            }
            if (checkForUpdated && changesList.updated && changesList.updated.length > 0) {
                for (let xKey in changesList.updated) {
                    for (let yKey in updatesArray) {
                        if (changesList.updated[xKey].id === updatesArray[yKey].id) {
                            updatesArray[yKey] = changesList.updated[xKey]
                        }
                    }
                }
                updateFlag = true;
            }
            if (changesList.removed && changesList.removed.length > 0) {
                for (let xKey in changesList.removed) {
                    for (let yKey in updatesArray) {
                        if (changesList.removed[xKey] === updatesArray[yKey].id) {
                            let index = updatesArray.indexOf(updatesArray[yKey]);
                            console.log('checking for removing index');
                            console.log(index);
                            if (index > -1) {
                                updatesArray.splice(index, 1);
                            }

                            //delete updatesArray[yKey];
                        }
                    }
                }
                updateFlag = true;
            }
        }
        return {updated: updateFlag, updatedObject: updatesArray};
    }

    enhancedDashboardUpdateList(oObj) {
        let eChangesList = {drafts: [], orders: []};

        for (let obj in oObj.drafts) {
            eChangesList.drafts.push({id: oObj.drafts[obj].id, client: oObj.drafts[obj].client, ticket: oObj.drafts[obj].ticket});
        }

        for (let obj in ordersObj.approved) {
            eChangesList.drafts.push({id: oObj.approved[obj].id, client: oObj.approved[obj].client, ticket: oObj.approved[obj].ticket});
        }

        for (let obj in ordersObj.confirmed) {
            eChangesList.orders.push({id: oObj.confirmed[obj].id, client: oObj.confirmed[obj].client, ticket: oObj.confirmed[obj].ticket});
        }

        return eChangesList;
    }

    updateAppInMemoryList(changesList) {
        let updtbject, updateEvFlag = false;

        if (changesList.drafts.added.length > 0 || changesList.drafts.updated.length > 0 || changesList.drafts.removed.length > 0) {
            updtbject = self.updateList(changesList.drafts, ordersObj.drafts, true);

            if (updtbject.updated === true) {
                updateEvFlag = true;
                ordersObj.drafts = updtbject.updatedObject;
            }
        }

        if (changesList.confirmed.added.length > 0 || changesList.confirmed.removed.length > 0) {
            updtbject = self.updateList(changesList.confirmed, ordersObj.confirmed, true);
            if (updtbject.updated === true) {
                updateEvFlag = true;
                ordersObj.confirmed = updtbject.updatedObject;
            }
        }

        if (changesList.approved.added.length > 0 || changesList.approved.removed.length > 0) {
            updtbject = self.updateList(changesList.approved, ordersObj.approved, true);
            if (updtbject.updated === true) {
                updateEvFlag = true;
                ordersObj.approved = updtbject.updatedObject;
            }
        }

        if (updateEvFlag) {
            //ioOrders.emit('ordersUpdate', self.getSocketMessage(changesList));
            ioDashb.emit('update', self.getSocketMessage(self.enhancedDashboardUpdateList(ordersObj)));
        }
    }

    requestOrderList() {
        return new Promise((resolve, reject) => {
            let restServPath = '/rest/purchases/drafts/list',
                idsObj = self.getIdsObj(),
                opts = {
                    url : odooSettings.protocol+'://'+odooSettings.host+':'+odooSettings.port + restServPath,
                    method: 'post',
  					json: true,
                    headers: {
                        Cookie: cookie
                    },
                    body: {
					    params: {
					        ids:  idsObj
					    }
                    }
                };
            request(opts, function (error, response, body) {
                if (error === null) {
                    console.log(body.result);
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
            self.updateAppInMemoryList(JSON.parse(data));
        })
        .catch((data) => {
            console.log(data);
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