const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        dbMng = require(constants.paths.models + 'DBManager'),
        http = require('http'),
        request = require('request');

let self, io, cookie, sckId, ordersObj = {'drafts': [], 'confirmed': [], 'approved': []};

class OrdersManager {

    constructor(session, ioInstance) {
        self = this;
        io = ioInstance;
        cookie = request.cookie('session_id='+session.session_id);
        sckId = 0;
    }

    attachIOListeners() {
        //Orders Web Socket Settings
        io.on('connection', function(socket){
            socket.emit('init', {sID: sckId, data: ordersObj.drafts});
        });

        io.on('blockOrder', (orderID) => {
            //@TODO: Validation, DB save, then event
            io.emit('orderBlocked', orderID);
        });

        io.on('deleteOrder', (orderID) => {
            //@TODO: Validation, DB save, then event
            io.emit('deleteOrderEvent', orderID);
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

    updateList(changesList, checkForUpdated = false) {
        let updatesArray = [], updateFlag = false;

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

                            delete updatesArray[yKey];
                        }
                    }
                }
                updateFlag = true;
            }
        }
        return {updated: updateFlag, updatedObject: updatesArray};
    }

    updateAppInMemoryList(changesList) {
        let updtbject, updateEvFlag = false;

        if (changesList.drafts.added.length > 0 || changesList.drafts.updated.length > 0 || changesList.drafts.removed.length > 0) {
            updtbject = self.updateList(changesList.drafts, true);
            if (updtbject.updated === true) {
                updateEvFlag = true;
                ordersObj.drafts = updtbject.updatedObject;
            }
        }

        if (changesList.confirmed.added.length > 0 || changesList.confirmed.removed.length > 0) {
            updtbject = self.updateList(changesList.confirmed, true);
            if (updtbject.updated === true) {
                updateEvFlag = true;
                ordersObj.confirmed = updtbject.updatedObject;
            }
        }

        if (changesList.approved.added.length > 0 || changesList.approved.removed.length > 0) {
            updtbject = self.updateList(changesList.approved, true);
            if (updtbject.updated === true) {
                updateEvFlag = true;
                ordersObj.approved = updtbject.updatedObject;
            }
        }

        /*if (updateEventInitFlag) {
            io.emit('ordersUpdate', self.getSocketMessage(changesList));
        }*/
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