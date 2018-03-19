const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        http = require('http'),
        request = require('request')
        tools = require(constants.paths.models + 'ToolsManager')
        draft = 'draft',
        confirmed = 'confirmed',
        approved = 'approved',
        closed = 'closed';

let self, 
    _ioOrders, 
    _ioDashb, 
    _dbInstance, 
    _cookie,
    _toolsManger,
    _usoml = {'drafts': [], 'approved': [], 'confirmed': []};

class OrdersManager {

    constructor(session, dbInst, ioOrdersInstance, ioDashbInstance) {
        self = this;
        _dbInstance = dbInst;
        _ioOrders = ioOrdersInstance;
        _ioDashb = ioDashbInstance;
        _toolsManger = new tools();
        _cookie = request.cookie('session_id='+session.session_id);
    }

/*
DB Orders Functions
=> Functions Summary::
Basic:
    getOrderDBObj -> returns standard DB Object (mongoose Optimized)
DB:
    saveOrderOnDB -> get DB order object and stores it on the database
Logs:
    getActivityLine -> returns log line (mongoose Optimized)
    addLogLine -> adds new log line to DB object registry and return the entire registry object 
    getLogRegistry -> returns entire log registry from DB Object
    addLogRegistry -> replaces entire log registry and returns the DB Object updated
*/

    getOrderDBObj(odooOrderRef, orderState, ticketNumber, client, productRows, activityLog) {
    /*
        Parameters:
        client: {id, name}
        productRows: {id, name, qty, price}
        activityLog: [{user: {uid, username}, date, changeLogs: [{id, product, action, qty, price}]
    */
        return (odooOrderRef, orderState, ticketNumber, client, productRows, activityLog) ? {
            odooOrderRef: odooOrderRef,
            orderState: orderState,
            ticketNumber: ticketNumber,
            client: client,
            productRows: productRows,
            activityLog: activityLog
        } : "Incorrect paramters";
    }

    saveOrderOnDB(orderData, prevSaved = false) {
        return _dbInstance.saveOrder(orderData, prevSaved);
    }

    getNewLogLine(uid, username) {
        return {
            user: {
                uid: uid,
                username: username,
            }, 
            date: new Date(),
            changeLogs: []
        };
    }

    getActivitiesLogLine(uid, username, changeLogsArray) {
        return {
            user: {
                uid: uid,
                username: username,
            }, 
            date: new Date(),
            changeLogs: changeLogsArray
        };
    }

    pushLogLine(logRegistry, logLine) {
        return logRegistry.unshift(logLine);
    }

    getOrderLogRegistry(dbOrderObject) {
        return dbOrderObject.activityLog;
    }

    getActivityLine(productID, productName, action, quantity, price) {
        return (id && product && action && quantity && price) ? {
            id: productID,
            product: productName,
            action: action,
            qty: quantity,
            price: price
        } : "Incorrect paramters";
    }

    updateLogRegistry(dbOrderObject, logRegistry) {
         dbOrderObject.activityLog = logRegistry;
         return dbOrderObject;
    }

    addLogLine(order, productId, productName, action, quantity, price) {
        return self.getOrderLogRegistry(order).unshift(self.getActivityLine(productId, productName, action, quantity, price););
    }

    getStatusChangeLogLine(state) {
        return self.getActivityLine(null, state, 'changed', null, null);
    }

    addAdminClosedStatusChange(order){
        let registry = self.getOrderLogRegistry(order);
        registry = self.pushLogLine(registry, self.getActivitiesLogLine(0, 'system', [self.getStatusChangeLogLine('closed')]));
        console.log(registry);
        return registry;
    }

//Server Orders
/*
=> Functions Summary::
Basic:
    getOrderServerObj ->
    pushOrderToServer -> Prepends Sever Order Object to Server in memory list
*/


    getOrderServerObj(odooOrderRef, client, ticket) {
    /*
        Parameters:
        odooOrderRef, client [id, name] ticket
    */
        return {
            id: odooOrderRef,
            client: {id: cObj.client.id, name: cObj.client.name},
            ticket: cObj.ticketNumber,
        };
    }

    pushOrderToServer(orderServerObj, section) {
        _usoml[section].unshift(orderServerObj);
    }


/*    
    orderTransfer(data) {
        return new Promise((resolve, reject) => {
            console.log(data);
            let fromOrderDBData, toOrderDBData, saveToOrderPromise, saveFromOrderPromise, mmrFromOrder, mmrToOrder,
                fromOrderDBDataPromise = dbInstance.getOrderById(data.from);

                fromOrderDBDataPromise.then((fromOrder) => {
                    let toOrderDBDataPromise = dbInstance.getOrderById(data.to);

                    fromOrderDBData = fromOrder;

                    toOrderDBDataPromise.then((toOrder) => {
                        toOrderDBData = toOrder;

                        console.log(fromOrderDBData);
                        console.log('=> ||| toOrderDBData');
                        console.log(toOrder);


                        if (!toOrderDBData) {
                            let sRegistry = _toolsManger.getDocumentFromArray(_usoml.drafts, 'id', data.to, true),
                                mmrOrderIndex = sRegistry.index,
                                mmrOrder = sRegistry.document;

                            if (mmrOrder) {
                                mmrOrder.orderDBData = {
                                    orderState: 'saved',
                                    odooOrderRef: mmrOrder.id,
                                    ticketNumber: mmrOrder.ticket,
                                    client: { 
                                        id: mmrOrder.client[0], name: mmrOrder.client[1] 
                                    },
                                    productRows: fromOrderDBData.productRows,
                                    activityLog: [{
                                        user: {
                                            uid: data.user.uId,
                                            username: data.user.uName,
                                        }, 
                                        date: new Date(), 
                                        changeLogs: [{
                                            id: null,
                                            product: data.from,
                                            action: 'transfered',
                                            qty: 1,
                                            price: null
                                        }] 
                                    }]
                                };

                                saveToOrderPromise =  self.saveOrderOnDB(toOrderDBData, true);

                                saveToOrderPromise.then((confirmation) => {
                                    _usoml.drafts[mmrOrderIndex] = mmrOrder;
                                    ioOrders.emit('orderUpdate', _usoml.drafts[mmrOrderIndex]);
                                }).catch((err) => {
                                    self.logDbError(err, 'trying to save Order into the DB');
                                });
                            } else {
                                self.logDbError('transfering order. Order to transfer not found.');
                            } 
                        } else {
                            toOrderDBData.productRows = fromOrderDBData.productRows;
                            toOrderDBData.activityLog.unshift({
                                user: {
                                    uid: data.user.uId,
                                    username: data.user.uName,
                                }, 
                                date: new Date(), 
                                changeLogs: [{
                                    id: null,
                                    product: data.from,
                                    action: 'transfered',
                                    qty: 1,
                                    price: null
                                }],
                            });
                            
                            saveToOrderPromise =  self.saveOrderOnDB(toOrderDBData, true);

                            saveToOrderPromise.then((confirmation) => {
                                ioOrders.emit('orderUpdate', self.parseDbToMmrRecords(toOrderDBData));
                            }).catch((err) => {
                                self.logDbError(err, 'trying to save Order into the DB');
                            });
                        }

                    fromOrderDBData.productRows = [];
                    fromOrderDBData.activityLog.unshift({
                        user: {
                            uid: data.user.uId,
                            username: data.user.uName,
                        }, 
                        date: new Date(), 
                        changeLogs: [{
                            id: null,
                            product: data.to,
                            action: 'transfered',
                            qty: 0,
                            price: null
                        }],
                    });
                    
                    saveFromOrderPromise =  self.saveOrderOnDB(fromOrderDBData, true);
                    saveFromOrderPromise.then((confirmation) => {
                        ioOrders.emit('orderUpdate', self.parseDbToMmrRecords(fromOrderDBData));
                        resolve()
                    }).catch((err) => {
                        self.logDbError(err, 'trying to save Order into the DB');
                        reject();
                    });
                });
            }).catch((err) => {
                self.logDbError(err, 'trying to save Order into the DB');
            });
        }).catch((err) => {
            self.logDbError(err, 'trying to save Order into the DB');
        });   
    }*/


    //@TO REFORMAT
    generateOrderActivityLogs(nOrderD, sOrderD) {
        let activityLogs = [];

        if(!sOrderD.orderDBData) {
            for(let index in nOrderD.productRows) {
                let prodObj = nOrderD.productRows[index];
                activityLogs.push(self.getActivityLine(prodObj.id, prodObj.name, 'added', prodObj.qty, prodObj.price);
            } 
        } else {
            let newOrderProducts = nOrderD.productRows,
                savedOrderProducts = sOrderD.orderDBData.productRows;
            
            for(let i in newOrderProducts) {
                let nProduct = newOrderProducts[i],
                    sRegistry = _toolsManger.getDocumentFromArray(savedOrderProducts, 'id', nProduct.id, true),
                    sProductIndex = sRegistry.index,
                    sProduct = sRegistry.document;

                if (!sProduct) {
                    //Get Added Products
                    activityLogs.unshift(self.getActivityLine(nProduct.id, nProduct.name, 'added', nProduct.qty, nProduct.price));
                } else {
                    //Get Updated Products
                    if (parseFloat(nProduct.qty) !== parseFloat(sProduct.qty)) {
                        activityLogs.push(self.getActivityLine(nProduct.id, nProduct.name, 'updated', nProduct.qty, nProduct.price);
                    }
                    savedOrderProducts.splice(sProductIndex, 1);
                }
            }

            //Get Deleted Products
            if (savedOrderProducts.length > 0) {
                for (let i = 0; i <= savedOrderProducts.length - 1; i++) {
                    activityLogs.push(self.getActivityLine(savedOrderProducts[i].id, savedOrderProducts[i].name, 'deleted', null, null);
                }
            }
        }

        if (!sOrderD.orderDBData || (sOrderD.orderDBData && sOrderD.orderDBData.orderState && nOrderD.orderState !== sOrderD.orderDBData.orderState)) {
            activityLogs.push(self.getActivityLine(null, nOrderD.orderState, 'changed', null, null);
        }

        return activityLogs;
    }

    //Move only required data from front-end and process in server
    //USE PROPERLY CREATED ACTIVITY LOGS
    gatherUpdatedOrderData(nOrderD, sOrderD) {
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
                odooOrderRef: sOrderD.id,
                orderState: nOrderD.orderState,
                ticketNumber: (sOrderD.ticket) ? sOrderD.ticket : 0,
                client: {
                    id: sOrderD.client.id,
                    name: sOrderD.client.name
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
            let saveOrderPromise, updateData, prevSaved = false,
                serverData = _toolsManger.getDocumentFromArray(_usoml.drafts, 'id', nOrderD.orderid, true),
                sOrderIndex = serverData.index,
                sOrder = serverData.document,
                processedData = self.gatherUpdatedOrderData(nOrderD, sOrder);

            if (!sOrder.orderDBData) {
                //New Order
                updateData = processedData;
            } else {
                //Update Order
                updateData = sOrder.orderDBData;

                prevSaved = true;
                updateData.orderState = processedData.orderState;
                updateData.productRows = processedData.productRows;
                updateData.activityLog.unshift(processedData.activityLog);
            }

            saveOrderPromise =  self.saveOrderOnDB(updateData, prevSaved);

            saveOrderPromise.then((confirmation) => {
                _usoml.drafts[sOrderIndex].orderDBData = updateData;
                _usoml.drafts[sOrderIndex].isBlocked = undefined;
                _ioOrders.emit('orderUpdate', _usoml.drafts[sOrderIndex]);
                resolve();
            }).catch((err) => {
                _toolsManger.logDbError(err, 'trying to save Order into the DB');
                reject();
            });
        });
    }

    checkForOrdersSavedOnDB(orderIdsArray) {
        return _dbInstance.getDraftsDbInfo(orderIdsArray);
    }

    checkOrdersOnSocketDisconnect(socketID) {
        for (let i in _usoml.drafts) {
            if (_usoml.drafts[i].isBlocked !== undefined && _usoml.drafts[i].isBlocked.socket === socketID) {
                _usoml.drafts[i].isBlocked = undefined;
                _ioOrders.emit('orderUnblocked', _usoml.drafts[i].id);
            }
        }
    }

    orderPullBackToSaved(data) {
        return new Promise((resolve, reject) => {
            let serverData = _toolsManger.getDocumentFromArray(_usoml.drafts, 'id', data.oId, true),
                index = serverData.index,
                order = serverData.document,
                orderDBData = order.orderDBData;

            if (order && order.isBlocked === undefined) {
                orderDBData.orderState = 'saved';
                //UPDATE TO PROPERLY GENERATED LOG
                orderDBData.activityLog.unshift({
                    user: {
                        uid: data.uId,
                        username: data.uName,
                    }, 
                    date: new Date(), 
                    changeLogs: [{
                        id: null,
                        product: 'saved',
                        action: 'changed',
                        qty: null,
                        price: null
                    }],
                });
                order.orderDBData = orderDBData;
                _usoml.drafts[index] = order;

                let savePromise = self.saveOrderOnDB(orderDBData, true);

                savePromise.then(() => {
                    _ioOrders.emit('orderUpdate', _usoml.drafts[index]);
                    resolve();
                }).catch((err) => {
                    _toolsManger.logDbError(err, 'trying to save Order into the DB');
                    reject();
                });
            } else {
                reject();
            }
        });
    }

    parseDbToMmrRecords(data) {
        let records = [];

        for(let i in data) {
            let cObj = data[i],
                orderOnServer = _toolsManger.getDocumentFromArray(_usoml.drafts, 'id', cObj.odooOrderRef);

            if (!orderOnServer) {
                records.push({
                    id: cObj.odooOrderRef,
                    client: cObj.client,
                    ticket: cObj.ticketNumber,
                    orderDBData: cObj
                });
            }
        }
        return records;
    }

    getCashierDashboardOrders() {
        return _dbInstance.getOrdersbyFilter({}, {}, 1, 100);
    }

    attachIOListeners() {
        //Dashboard Web Socket
        _ioDashb.on('connection', (socket) => {
            socket.emit('connect');

            socket.on('request', (data) => {
                socket.emit('data', self.enhancedDashboardUpdateList(_usoml));
            });
        });

        //Orders Web Socket
        _ioOrders.on('connection', (socket) => {
            socket.emit('init', _usoml.drafts);

            socket.on('initCashierRequest', (returnFn) => {
                let getDbSavedInfo = self.getCashierDashboardOrders(),
                    dataObj = _usoml.drafts;

                getDbSavedInfo.then((data) => {
                    if (data) {
                        let array1 = self.parseDbToMmrRecords(data),
                            array2 = dataObj.concat(array1);

                        returnFn(array2);
                    }
                }).catch((err) => {
                    returnFn({error: err});
                });
            });

            socket.on('blockOrder', (data, returnFn) => {
                let serverData = _toolsManger.getDocumentFromArray(_usoml.drafts, 'id', data.orderID, true),
                    index = serverData.index,
                    order = serverData.document;

                if (order.isBlocked === undefined || (orderDBData && orderDBData.orderState !== 'done')) {
                    _usoml.drafts[index].isBlocked = {socket: socket.id, user: data.user};
                    _ioOrders.emit('orderBlocked', {orderID: data.orderID, user: data.user});
                    returnFn({order: order, orderAvailable: true});
                } else {
                    returnFn({orderAvailable: false});
                }
            });

            socket.on('unblockOrder', (orderID, returnFn) => {
                let serverData = _toolsManger.getDocumentFromArray(_usoml.drafts, 'id', orderID, true),
                    index = serverData.index;

                _usoml.drafts[index].isBlocked = undefined;
                returnFn(true);
                _ioOrders.emit('orderUnblocked', orderID);
            });

            socket.on('deleteOrder', (orderID) => {
                //@TODO: Validation, DB save, then event
                socket.emit('deleteOrderEvent', orderID);
            });

            socket.on('transferOrder', (data, returnFn) => {
                let transferPromise = self.orderTransfer(data);

                transferPromise.then((ordersData) => {
                    if (success) returnFn(true);
                }).catch((err) => {
                    returnFn(false);
                    _toolsManger.logDbError(err, 'trying to transfer Order into the DB');
                });
            });

            socket.on('updateOrder', (nOrder, returnFn) => {
                let saveProcedurePromise = self.updateOrderOnDB(nOrder);

                saveProcedurePromise.then(() => {
                    returnFn(true);
                }).catch((err) => {
                    _toolsManger.logDbError(err, 'trying to save Order into the DB');
                    returnFn(false);
                });
            });

            socket.on('pullBackOrder', (data, returnFn) => {
                let pullBackPromise = self.orderPullBackToSaved(data);

                pullBackPromise.then(() => {
                    returnFn(true);
                }).catch((err) => {
                    _toolsManger.logDbError(err, 'trying to save Order into the DB');
                    returnFn(false);
                });
            });

            socket.on('disconnect', () => {
                self.checkOrdersOnSocketDisconnect(socket.id);
            });

        });
    }

    getIdsObj() {
        let section, idsObj = {};

        for (let sectInd in _usoml) {
            section = _usoml[sectInd];
            idsObj[sectInd] = new Array();

            for (let doc in section) {
                idsObj[sectInd].push({id:section[doc].id, last_update:section[doc].last_update});
            }
        }
        return idsObj;
    }

    getDraftsIdsArray(){
        let idsArray = [];

        for (let index in _usoml['drafts']) {
            let order = _usoml.drafts[index];
            if (order.orderDBData === undefined) idsArray.push(order.id);
        }

        return idsArray;
    }

    

    enhancedDashboardUpdateList(oObj) {
        let eChangesList = {drafts: [], orders: []};

        for (let obj in oObj.drafts) {
            eChangesList.drafts.push({id: oObj.drafts[obj].id, client: oObj.drafts[obj].client, ticket: oObj.drafts[obj].ticket});
        }

        for (let obj in _usoml.approved) {
            eChangesList.drafts.push({id: oObj.approved[obj].id, client: oObj.approved[obj].client, ticket: oObj.approved[obj].ticket});
        }

        for (let obj in _usoml.confirmed) {
            eChangesList.orders.push({id: oObj.confirmed[obj].id, client: oObj.confirmed[obj].client, ticket: oObj.confirmed[obj].ticket});
        }

        eChangesList.drafts.sort((x, y) => { return x.last_update - y.last_update;});
        eChangesList.orders.sort((x, y) => { return x.last_update - y.last_update;});

        return eChangesList;
    }

    getIOUpdatesOrders(changesList){
        let ioDraftsUpdatesObject = {added:[], updated:[], removed:[]};

        for(let i in changesList.added) {
            ioDraftsUpdatesObject.added.push(_toolsManger.getDocumentFromArray(_usoml.drafts, 'id', changesList.added[i].id));
        }

        for(let i in changesList.updated) {
            ioDraftsUpdatesObject.updated.push(_toolsManger.getDocumentFromArray(_usoml.drafts, 'id', changesList.updated[i].id));
        }

        for(let i in changesList.removed) {
            ioDraftsUpdatesObject.removed.push(changesList.removed[i]);
        }

        return ioDraftsUpdatesObject;
    }

    //updates the in Memory Server Orders List
    updateList(changesList, updatesArray) {
        let updateFlag = false;

        if (changesList) {
            if (changesList.added && changesList.added.length > 0) {    
                for (let key in changesList.added) {
                    updatesArray.push(changesList.added[key]);
                }
                updateFlag = true;
            }
            if (changesList.updated && changesList.updated.length > 0) {
                for (let xKey in changesList.updated) {
                    for (let yKey in updatesArray) {
                        if (changesList.updated[xKey].id === updatesArray[yKey].id) {
                            updatesArray[yKey] = changesList.updated[xKey];
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

    checkUSOMLSectUpdt(changesList, section) {
        let updtbject = self.updateList(changesList, _usoml[section]);

        if (updtbject.updated) _usoml[section] = updtbject.updatedObject;

        return updtbject.updated;
    }

    updateUSOML(changesList) {
        let getDbSavedInfo, updateEvFlag = false;

        for (let section in changesList) {
            if (self.checkUSOMLSectUpdt(changesList[section], section)) updateEvFlag = true;
        }

        getDbSavedInfo = self.checkForOrdersSavedOnDB(self.getDraftsIdsArray());

        getDbSavedInfo.then((dbOrdersArray) => {
            for(let index in dbOrdersArray) {
                let odbData = dbOrdersArray[index],
                serverData = _toolsManger.getDocumentFromArray(_usoml.drafts, 'id', odbData.odooOrderRef, true),
                sOrderIndex = serverData.index;
           
                _usoml.drafts[sOrderIndex].orderDBData = odbData;
            }
        }).catch((err) => {
            _toolsManger.logDbError('getting DB order records',err);
        }).then(() => {
            if (updateEvFlag) _ioOrders.emit('screenUpdate', self.getIOUpdatesOrders(changesList.drafts));
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
                        Cookie: _cookie
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
            self.updateUSOML(JSON.parse(data));
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
        }, constants.appSettings.purchaseListRefreshTime * 1000);
    }
}

module.exports = OrdersManager;