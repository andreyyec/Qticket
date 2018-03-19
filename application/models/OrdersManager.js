const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        http = require('http'),
        request = require('request'),
        Order = require(constants.paths.models + 'Order'),
        Tools = require(constants.paths.models + 'ToolsManager')
        states = {added: 'added', updated: 'updated', removed: 'removed'};

class OrdersManager {

    constructor(session, dbInst, ioOrdersInstance, ioDashbInstance) {
        this._tools = new Tools();
        this._dbInstance = dbInst;
        this._ioOrders = ioOrdersInstance;
        this._ioDashb = ioDashbInstance;
        this._cookie = request.cookie('session_id='+session.session_id);
        this._usoml = {'drafts': [], 'approved': [], 'confirmed': []};
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

        console.log(dashbData);

        return dashbData;
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
            //socket.emit('init', ordersObj.drafts);

            socket.on('blockOrder', (data, returnFn) => {
                /*let serverData = this.getDocumentFromArray(ordersObj.drafts, 'id', data.orderID, true),
                    index = serverData.index,
                    order = serverData.document;

                if (order.isBlocked === undefined || (orderDBData && orderDBData.orderState !== 'done')) {
                    ordersObj.drafts[index].isBlocked = {socket: socket.id, user: data.user};
                    ioOrders.emit('orderBlocked', {orderID: data.orderID, user: data.user});
                    returnFn({order: order, orderAvailable: true});
                } else {
                    returnFn({orderAvailable: false});
                }*/
            });

            socket.on('unblockOrder', (orderID, returnFn) => {
                /*let serverData = this.getDocumentFromArray(ordersObj.drafts, 'id', orderID, true),
                    index = serverData.index;

                ordersObj.drafts[index].isBlocked = undefined;
                returnFn(true);
                ioOrders.emit('orderUnblocked', orderID);*/
            });

            socket.on('deleteOrder', (orderID) => {
                //@TODO: Validation, DB save, then event
                //socket.emit('deleteOrderEvent', orderID);
            });

            socket.on('updateOrder', (nOrder, returnFn) => {
                /*let saveProcedurePromise = this.updateOrderOnDB(nOrder);

                saveProcedurePromise.then(() => {
                    returnFn(true);
                }).catch((err) => {
                    this.logDbError(err, 'trying to save Order into the DB');
                    returnFn(false);
                });*/
            });

            socket.on('pullBackOrder', (data, returnFn) => {
                /*let pullBackPromise = this.orderPullBackToSaved(data);

                pullBackPromise.then(() => {
                    returnFn(true);
                }).catch((err) => {
                    this.logDbError(err, 'trying to save Order into the DB');
                    returnFn(false);
                });*/
            });

            socket.on('disconnect', () => {
                //this.checkOrdersOnSocketDisconnect(socket.id);
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
        this._ioDashb.emit('update', this._getDashboardData());
    }

    _usomlActionSwitch(section, subS, order) {
        let savOrdInd, orderObj;

        if (subS === states.added || subS === states.updated) {
            orderObj = this._getOrderObject(order);
        }

        if (subS === states.updated || subS === states.removed) {
            savOrdInd = this._getUSOMLDataById((subS === states.removed) ? order : order.getId(), section, 1);
        }

        switch(subS) {
            case states.added:
                this._usoml[section].push(orderObj);
                break;
            case states.updated:
                this._usoml[section][savOrdInd] = orderObj;
                break;
            case states.removed:
                this._usoml[section].splice(savOrdInd, 1);
                break;
            default:
                console.log('Unrecognized action');
                break;
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