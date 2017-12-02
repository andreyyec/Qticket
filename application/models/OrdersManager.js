const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        http = require('http'),
        request = require('request');

let self, ioOrders, ioDashb, ioDashboardInstance, dbInstance, cookie, sckId, 
    ordersObj = {'drafts': [], 'approved': [], 'confirmed': []};

class OrdersManager {

    constructor(session, dbInst, ioOrdersInstance, ioDashbInstance) {
        self = this;
        dbInstance = dbInst;
        ioOrders = ioOrdersInstance;
        ioDashb = ioDashbInstance;
        cookie = request.cookie('session_id='+session.session_id);
        sckId = 0;
    }

    logDbError(err, msg = 'processing') {
        console.log('Error while ' + msg);
        console.log(err);
    }

    getDocumentFromArray (array, property, value, getIndex = false) {
        if (array.constructor === Array) {
            if (getIndex) {
                let doc = array.filter(x => x[property] === value);
                if (doc) {
                    return {document: doc[0], index: array.findIndex(x => x[property] === value)};
                } else {
                    return {document: undefined, index: undefined};    
                }
            }else {
                return array.findIndex(x => x[property] === value);
            }
        } else {
            return false;
        }
    }

    saveOrderOnDB(orderData) {
        if (order) {}

        return dbInstance.saveOrder(orderData);
    }

    generateOrderActivityLogs(nOrderD, sOrderD) {
        let activityLogs = [];

        if(!sOrderD.orderDBData) {
            for(let index in nOrderD.productRows) {
                let productObj = nOrderD.productRows[index];
                activityLogs.push({product:productObj.productName, action:'added', qty:productObj.productQty, price:productObj.productPrice});
            } 
        } else {
            //Get Added

            //Get Updated

            //Get Deleted

            console.log('[DEBUG]=>Compare to old previous order');
        }


        return activityLogs;
    }

    //Move only required data from front-end and process in server
    gatherToStoreOrderData(nOrderD, sOrderD) {
        let nOrderLogs = self.generateOrderActivityLogs(nOrderD, sOrderD);

        if (sOrderD.orderDBData) {
            return {
                orderState: nOrderD.orderState,
                productRows: nOrderD.productRows,
                activityLog: {
                    user: {
                        odooUserId: nOrderD.activityLog.user.odooUserId,
                        username: nOrderD.activityLog.user.username
                    },
                    date: new Date(), 
                    changeLogs: nOrderLogs
                }
                
            }
        } else {
            return {
                orderState: nOrderD.orderState,
                odooOrderRef: sOrderD.id,
                ticketNumber: sOrderD.order,
                client: {
                    id: sOrderD.client[0], 
                    name: sOrderD.client[1]
                },
                productRows: nOrderD.productRows,
                activityLog: [{
                    user: {
                        odooUserId: nOrderD.activityLog.user.odooUserId,
                        username: nOrderD.activityLog.user.username
                    },
                    date: new Date(),
                    changeLogs: nOrderLogs
                }]
            }
        }
    }

    updateOrderOnDB(nOrderD) {
        return new Promise((resolve, reject) => {
            let saveOrderPromise, updateData,
                serverData = self.getDocumentFromArray(ordersObj.drafts, 'id', nOrderD.orderid, true),
                sOrderIndex = serverData.index,
                sOrder = serverData.document,
                processedData = self.gatherToStoreOrderData(nOrderD, sOrder);

            if (!sOrder.orderDBData) {
                //New Order
                updateData = processedData;
            } else {
                //Update Order
                let actLog, updateData = sOrder.orderDBData;

                updateData.orderState = processedData.orderState;
                updateData.productRows = processedData.productRows;
                actLog =  processedData.changeLogs.concat(updateData.activityLog);
                updateData.activityLog = orderLogs;
            }

            saveOrderPromise =  self.saveOrderOnDB(updateData);

            saveOrderPromise.then((confirmation) => {
                ordersObj.drafts[sOrderIndex].orderDBData = updateData;
                ioOrders.emit('orderUpdate', updateData);
                returnFn(true);
            }).catch((err) => {
                self.logDbError(err, 'trying to save Order into the DB');
                returnFn(false);
            });
        });
    }

    

    checkForOrdersSavedOnDB(orderIdsArray) {
        return dbInstance.getDraftsDbInfo(orderIdsArray);
    }

    checkOrdersOnSocketDisconnect(socketID) {
        for (let i in ordersObj.drafts) {
            if (ordersObj.drafts[i].isBlocked !== undefined && ordersObj.drafts[i].isBlocked.socket === socketID) {
                ordersObj.drafts[i].isBlocked = undefined;
                ioOrders.emit('orderUnblocked', ordersObj.drafts[i].id);
            }
        }
    }

    attachIOListeners() {
        //Dashboard Web Socket
        ioDashb.on('connection', (socket) => {
            socket.emit('connect');

            socket.on('request', (data) => {
                socket.emit('data', self.enhancedDashboardUpdateList(ordersObj));
            });
        });

        //Orders Web Socket
        ioOrders.on('connection', (socket) => {
            socket.emit('init', {sID: sckId, data: ordersObj.drafts});

            socket.on('blockOrder', (data, returnFn) => {
                let serverData = self.getDocumentFromArray(ordersObj.drafts, 'id', data.orderID, true),
                    index = serverData.index,
                    order = serverData.document;

                if (order.isBlocked === undefined) {
                    ordersObj.drafts[index].isBlocked = {socket: socket.id, user: data.user};
                    ioOrders.emit('orderBlocked', {orderID: data.orderID, user: data.user});
                    returnFn({order: order, orderAvailable: true});
                } else {
                    returnFn({orderAvailable: false});
                }
            });

            socket.on('unblockOrder', (orderID, returnFn) => {
                let serverData = self.getDocumentFromArray(ordersObj.drafts, 'id', orderID, true),
                    index = serverData.index;

                ordersObj.drafts[index].isBlocked = undefined;
                returnFn(true);
                ioOrders.emit('orderUnblocked', orderID);
            });

            socket.on('deleteOrder', (orderID) => {
                //@TODO: Validation, DB save, then event
                socket.emit('deleteOrderEvent', orderID);
            });

            socket.on('updateOrder', (nOrder, returnFn) => {
                let saveProcedurePromise = self.updateOrderOnDB(nOrder);

                saveProcedurePromise.then((confirmation) => {
                    
                    returnFn(true);
                }).catch((err) => {
                    //here
                    self.logDbError(err, 'trying to save Order into the DB');
                    returnFn(false);
                });

                //HERE

                /*let savePromise = self.saveOrderOnDB(nOrder);

                savePromise.then((result) => {
                    if(result) {
                        //here
                        ordersObj.drafts[sOrderIndex].orderDBData = nOrder;
                        ordersObj.drafts[sOrderIndex].isBlocked = undefined;
                        ioOrders.emit('orderUpdate', ordersObj.drafts[sOrderIndex]);

                        //Trigger Update event over IO
                        //Handle correct execution on orders.js
                        returnFn(true);
                    } else {
                        returnFn(false);
                    }
                }).catch((err)=> {
                    self.logDbError(err, 'trying to save Order into the DB');
                });*/
            });

            socket.on('disconnect', () => {
                self.checkOrdersOnSocketDisconnect(socket.id);
            });

        });
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

    getDraftsIdsArray(){
        let idsArray = [];

        for (let index in ordersObj['drafts']) {
            let order = ordersObj.drafts[index];
            if (order.orderDBData === undefined) {
                idsArray.push(order.id);    
            }
        }

        return idsArray;
    }

    updateList(changesList, updatesArray, checkForUpdated = false) {
        let updateFlag = false;

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
                            if (index > -1) {
                                updatesArray.splice(index, 1);
                            }
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

        eChangesList.drafts.sort((x, y) => { return x.last_update - y.last_update;});
        eChangesList.orders.sort((x, y) => { return x.last_update - y.last_update;});

        return eChangesList;
    }

    updateAppInMemoryList(changesList) {
        let updtbject, getDbSavedInfo, updateEvFlag = false;

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

        getDbSavedInfo = self.checkForOrdersSavedOnDB(self.getDraftsIdsArray());

        getDbSavedInfo.then(() => {
            //Render products from previously saved orders
        }).catch((err) => {
            self.logDbError('getting DB order records',err);
        }).then(() => {
            if (updateEvFlag) {
                ioDashb.emit('update', self.enhancedDashboardUpdateList(ordersObj));
            }
        });
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
                    //[DEBUG] Globals
                    //console.log(body.result);
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
        .catch((err) => {
            console.log(err);
            console.log('Error while trying to get purchases list');
        });
    }

    initLoop() {
        self.requestProcedure();
        self.attachIOListeners();

        setInterval(() => {
            self.requestProcedure();
            //[DEBUG] Globals
            //console.log(ordersObj);
        }, constants.appSettings.purchaseListRefreshTime);
    }
}

module.exports = OrdersManager;