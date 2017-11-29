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

    getDocumentFromArray (array, property, value, getIndex = false) {
        if (array.constructor === Array) {
            if (getIndex) {
                return {document: array.filter(x => x[property] === value), index: array.findIndex(x => x[property] === value)};
            }else {
                return array.findIndex(x => x[property] === value);
            }
        } else {
            console.log('[ERROR] variable provided is not array');
            return false;
        }
    }

    generateOrderActivityLogs(nOrderD, sOrderD) {
        let activityLogs = [];

        if(sOrderD.orderDBData === undefined) {
            for(let index in nOrderD.productRows) {
                let productObj = nOrderD.productRows[index];
                activityLogs.push({product:productObj.productName, action:'added', qty:productObj.productQty, price:productObj.productPrice});
            } 
        } else {
            /*for(let index in nOrderD.productRows) {
                let activityArray
            }    */
            console.log('[DEBUG]=>Compare to old previous order');
        }
        return activityLogs;
    }

    saveOrderOnDB(orderData) {
        return new Promise((resolve, reject) => {

            let dbSaveProcess = dbInstance.saveOrder(orderData);

            dbSaveProcess.then((result) => {
                console.log('Save Order Result');
                console.log(result);

                if (result) {
                    resolve(true);
                } else {
                    reject();
                }
            }).catch((err)=> {
                console.log('Error while trying to save into the DB');
                console.log(err);
            });
        });
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
                let serverData = self.getDocumentFromArray(ordersObj.drafts, 'id', nOrder.odooOrderRef, true),
                    sOrderIndex = serverData.index,
                    sOrder = serverData.document;

                nOrder.activityLog[0].changeLogs = self.generateOrderActivityLogs(nOrder, sOrder, sOrderIndex);

                let savePromise = self.saveOrderOnDB(nOrder);

                savePromise.then((result) => {
                    if(result) {
                        ordersObj.drafts[sOrderIndex] = nOrder;
                        //Save data stored into the DB, to the inMemoryOrdersObject
                        //Trigger Update event over IO
                        //Handle correct execution on orders.js
                        returnFn(true);
                    } else {
                        returnFn(false);
                    }
                }).catch((err)=> {
                    console.log('Error while trying to save into the DB');
                    console.log(err);
                });
            });

            socket.on('disconnect', () => {
                self.checkOrdersOnSocketDisconnect(socket.id);
            });

        });
    }

    getSocketMessage(sdata) {
        sckId ++;
        return {sID: sckId, data: sdata};
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
            ioDashb.emit('update', self.enhancedDashboardUpdateList(ordersObj));
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
            console.log(ordersObj);
        }, constants.appSettings.purchaseListRefreshTime);
    }
}

module.exports = OrdersManager;