const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        http = require('http'),
        request = require('request'),
        Order = require(constants.paths.models + 'Order'),
        Tools = require(constants.paths.models + 'ToolsManager'),
        sections = {drafts: 'drafts', approved: 'approved', confirmed: 'confirmed'},
        states = {added: 'added', updated: 'updated', removed: 'removed'};

class OrdersManager {

    constructor(session, dbInst, ioOrdersInstance, ioDashbInstance) {
        this._draftsSecUpdated = false;
        this._dashbUpdated = false;
        this._tools = new Tools();
        this._dbInstance = dbInst;
        this._ioOrders = ioOrdersInstance;
        this._ioDashb = ioDashbInstance;
        this._cookie = request.cookie('session_id='+session.session_id);
        this._usoml = {'drafts': {}, 'approved': {}, 'confirmed': {}};
    }

    _getIdsObj() {
        let idsObj = {};

        for (let sectInd in this._usoml) {
            idsObj[sectInd] = new Array();
            for (let orderInd in this._usoml[sectInd]) {
                let cOrder = this._usoml[sectInd][orderInd];

                idsObj[sectInd].push({id:cOrder.getId(), last_update:cOrder.getLastUpdate()});
            }
        }

        return idsObj;
    }

    _getOrderObject(orderInfo) {
        return new Order(this._dbInstance, this._ioOrders, orderInfo.id, orderInfo.client, orderInfo.ticket, orderInfo.last_update);
    }

    _getOrdersData(array) {
        let wsckOrders = {};
        for(let ordInd in this._usoml.drafts) {
            let cOrder = this._usoml.drafts[ordInd];
            wsckOrders[cOrder.getId()] = cOrder.getWSocketInf();
        }
        return wsckOrders;
    }

    _getUSOMLDataById (id, section, workingMode = 0) {
        for(let orderInd in this._usoml[section]) {
            let cOrder = this._usoml[section][orderInd];
            
            if (cOrder.getId() === id) {
                switch (workingMode) {
                    case 0:
                        return cOrder;
                        break;
                    case 1:
                        return orderInd;
                        break;
                    case 2:
                        return {order: cOrder, index: array.findIndex(x => x[property] === value)};
                    break;
                }
            }
        }
        return false;
    }

    _getDashboardData() {
        let cSection, sectIx = 0, dashbData = {drafts: [], orders: []};

        for (let sectInd in this._usoml) {
            cSection = (sectIx === 0) ? 'drafts' : 'orders';

            for (let orderInd in this._usoml[sectInd]) {
                let cOrder = this._usoml[sectInd][orderInd];
                dashbData[cSection].push(cOrder.getDashBInf());
            }
            sectIx ++;
        }

        dashbData.drafts.sort((x, y) => { return x.last_update - y.last_update;});
        dashbData.orders.sort((x, y) => { return x.last_update - y.last_update;});

        return dashbData;
    }

    async _getDailyCancelledOrders() {
        let data, genOrder, order, parsedData = [];
                
        try {
            data = await this._dbInstance.getOrdersbyFilter({orderState: 4}, {}, 1, 100);

            if (data.length > 0) {
                order = new Order();

                for(let ord of data) {
                    parsedData.push(order.parseDBtoWsockInfo(ord));
                }

                return parsedData;
            } else {
                return [];
            }
        } catch(err) {
            Tools.logDbError('while trying to pull daily cancelled orders');
            return false;
        }
    }

    _releaseOrderOnDisconnect(socketId) {
        for(let ordInd in this._usoml[sections.drafts]) {
            if (!this._usoml[sections.drafts][ordInd].isAvailable()) {
                if (this._usoml[sections.drafts][ordInd].getSocketId() === socketId) {
                    this._usoml[sections.drafts][ordInd].unblock(constants.qticketManagerAccount, true);
                    this._ioOrders.emit('orderUnblocked', this._usoml[sections.drafts][ordInd].getId());
                }
            }
        }
    }

    _attachIOListeners() { //@WORK IN PROGRESS
        //Dashboard Web Socket
        this._ioDashb.on('connection', (socket) => {
            socket.emit('connect');

            socket.on('request', (data) => {
                socket.emit('data', this._getDashboardData());
            });
        });

        //Orders Web Socket
        this._ioOrders.on('connection', (socket) => {
            socket.emit('init', this._getOrdersData());

            socket.on('pullDailyCancelledOrders', async (returnFn) => {

                let data = await this._getDailyCancelledOrders();
                returnFn(data);
                
                /* let getDbSavedInfo = this._getCashierDashboardOrders(),
                    dataObj = _usoml.drafts;

                getDbSavedInfo.then((data) => {
                    if (data) {
                        let array1 = self.parseDbToMmrRecords(data),
                            array2 = dataObj.concat(array1);

                        returnFn(array2);
                    }
                }).catch((err) => {
                    returnFn({error: err});
                }); */
            });

            socket.on('blockOrder', (data, returnFn) => {
                if (this._usoml[sections.drafts][data.orderId] && this._usoml[sections.drafts][data.orderId].block(socket, data.user)) {
                    this._ioOrders.emit('orderBlocked', {orderId: data.orderId, user: data.user});

                    returnFn(this._usoml[sections.drafts][data.orderId].getWSocketInf());
                } else {
                    returnFn(false);
                }
            });

            socket.on('unblockOrder', (data, returnFn) => {
                if (this._usoml[sections.drafts][data.orderId] && this._usoml[sections.drafts][data.orderId].unblock(data.user)) {
                    this._ioOrders.emit('orderUnblocked', data.orderId);
                    returnFn(true);
                } else {
                    returnFn(false);
                }
            });

            socket.on('updateOrder', async (nOrder, returnFn) => {
                if (this._usoml[sections.drafts][nOrder.id]) {
                    try {
                        let updateConfirmation = await this._usoml[sections.drafts][nOrder.id].update(nOrder);

                        if (updateConfirmation) {
                            this._ioOrders.emit('orderUpdated', this._usoml[sections.drafts][nOrder.id].getWSocketInf());
                            returnFn(true);
                        } else {
                            Tools.logDbError('', 'trying to save Order into the DB');
                            returnFn(false);
                        }
                    } catch(err) {
                        Tools.logDbError(err, 'trying to save Order into the DB');
                        returnFn(false);
                    }   
                } else {
                    Tools.logApplicationError('Unable to find Order');
                    returnFn(false);
                }
            });


            /* Review error catched and logging */
            socket.on('pullBackOrder', async (data, returnFn) => {
                if (this._usoml[sections.drafts][data.orderId]) {
                    try {
                        let conf = await this._usoml[sections.drafts][data.orderId].pullback(data.user);

                        if (conf) {
                            this._ioOrders.emit('orderUpdated', this._usoml[sections.drafts][data.orderId].getWSocketInf());
                            returnFn(true);
                        } else {
                            returnFn(false);
                        }
                    } catch(err) {
                        Tools.logDbError(err, 'trying to save Order into the DB');
                        returnFn(false);
                    }
                } else {
                    Tools.logDbError(err, 'trying to save Order into the DB');
                    returnFn(false);
                }
            });

            socket.on('cancelOrder', async (data, returnFn) => {
                if (this._usoml[sections.drafts][data.orderId]) {
                    try {
                        let conf = await this._usoml[sections.drafts][data.orderId].cancel(data.user);

                        if (conf) {
                            this._ioOrders.emit('orderUpdated', this._usoml[sections.drafts][data.orderId].getWSocketInf());
                            returnFn(true);
                        } else {
                            returnFn(false);
                        }
                    } catch(err) {
                        Tools.logDbError(err, 'trying to save Order into the DB');
                        returnFn(false);
                    }
                } else {
                    Tools.logDbError(err, 'trying to save Order into the DB');
                    returnFn(false);
                }
            });

            socket.on('closeOrder', async (data, returnFn) => {
                if (this._usoml[sections.drafts][data.orderId]) {
                    try {
                        let conf = await this._usoml[sections.drafts][data.orderId].close(data.user);

                        if (conf) {

                            /* @!TODO: Remove order from server memory and websocket clients*/

                            this._ioOrders.emit('orderUpdated', this._usoml[sections.drafts][data.orderId].getWSocketInf());
                            returnFn(true);
                        } else {
                            returnFn(false);
                        }
                    } catch(err) {
                        Tools.logDbError(err, 'trying to save Order into the DB');
                        returnFn(false);
                    }
                } else {
                    Tools.logDbError(err, 'trying to save Order into the DB');
                    returnFn(false);
                }
            });


            /* Update to eliminate the order from the server memory*/
            socket.on('closeOrder', async (data, returnFn) => {
                if (this._usoml[sections.drafts][data.orderId]) {
                    try {
                        let conf = await this._usoml[sections.drafts][data.orderId].close(data.user);

                        if (conf) {
                            this._ioOrders.emit('orderUpdated', this._usoml[sections.drafts][data.orderId].getWSocketInf());
                            returnFn(true);
                        } else {
                            returnFn(false);
                        }
                    } catch(err) {
                        Tools.logDbError(err, 'trying to save Order into the DB');
                        returnFn(false);
                    }
                } else {
                    Tools.logDbError(err, 'trying to save Order into the DB');
                    returnFn(false);
                }
            });

            /* Update to eliminate the order from the server memory*/
            socket.on('cancelOrder', async (data, returnFn) => {
                if (this._usoml[sections.drafts][data.orderId]) {
                    try {
                        let conf = await this._usoml[sections.drafts][data.orderId].cancel(data.user);

                        if (conf) {
                            this._ioOrders.emit('orderUpdated', this._usoml[sections.drafts][data.orderId].getWSocketInf());
                            returnFn(true);
                        } else {
                            returnFn(false);
                        }
                    } catch(err) {
                        Tools.logDbError(err, 'trying to save Order into the DB');
                        returnFn(false);
                    }
                } else {
                    Tools.logApplicationError('Unable to find Order');
                    returnFn(false);
                }
            });

            socket.on('disconnect', () => {
                this._releaseOrderOnDisconnect(socket.id);
            });
        });
    }

    _usomlUpdate(data) {
        for (let sect in data) {
            for(let subS  in data[sect]) {
                if (data[sect][subS].length > 0) {
                    for(let objInd in data[sect][subS]) {
                        this._usomlActionSwitch(sect, subS, data[sect][subS][objInd]);
                    }  
                }
            }
        }
        this._uiUpdate(data.drafts);
    }

    _usomlActionSwitch(section, subS, order) {
        let savOrdInd, orderObj;

        if (subS === states.added || subS === states.updated) {
            orderObj = this._getOrderObject(order);
        }

        if (subS === states.updated || subS === states.removed) {
            savOrdInd = this._getUSOMLDataById((subS === states.removed) ? order : orderObj.getId(), section, 1);
        }

        switch(subS) {
            case states.added:
                this._usoml[section][orderObj.getId()] = orderObj;
                break;
            case states.updated:
                this._usoml[section][order.id].odooUpdate(order);
                break;
            case states.removed:
                if (section === sections.drafts && this._usoml[section][order.id].getState() < 3) {
                    console.log('=> Closing a draft');
                    console.log(constants.qticketManagerAccount);

                    this._usoml[section][order.id].close(constants.qticketManagerAccount);
                }

                delete this._usoml[section][order];
                
                break;
            default:
                console.log('Unrecognized action');
                break;
        }

        this._dashbUpdated = true;

        if (section === sections.drafts) {
            this._draftsSecUpdated = true;
        }
    }

    _uiUpdate(data) {
        if (this._dashbUpdated) {
            this._ioDashb.emit('update', this._getDashboardData());
            
            if (this._draftsSecUpdated === true) {
                this._ioOrders.emit('screenUpdate', data);
                this._draftsSecUpdated = false;
            }
        }
    }

    _requestOrderList() {
        return new Promise((resolve, reject) => {
            let restServPath = '/rest/purchases/drafts/list',
                idsObj = this._getIdsObj(),
                opts = {
                    url : odooSettings.protocol+'://'+odooSettings.host+':'+odooSettings.port + restServPath,
                    method: 'post',
  					json: true,
                    headers: {
                        cookie: this._cookie
                    },
                    body: {
					    params: {
					        ids:  idsObj
					    }
                    }
                };
            request(opts, function (error, response, body) {
                if (error === null) {
                    //console.log('[DEBUG] Globals');
                    //console.log(body.result);
                    resolve(body.result);
                } else {
                    reject();
                }
            });
        });
    }

    _requestProcedure() {
        let getDraftsList = this._requestOrderList();

        getDraftsList.then((data) => {
            this._usomlUpdate(JSON.parse(data));
        })
        .catch((err) => {
            console.log(err);
            console.log('Error while trying to get purchases list');
        });
    }

    start() {
        this._requestProcedure();
        this._attachIOListeners();

        setInterval(() => {
            this._requestProcedure();
        }, constants.appSettings.purchaseListRefreshTime * 1000);
    }
}

module.exports = OrdersManager;