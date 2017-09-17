const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        dbMng = require(constants.paths.models + 'DBManager'),
        http = require('http'),
        request = require('request');

let self, io, cookie, ordersArray = [];

class OrdersManager {

    constructor(session, ioInstance) {
        self = this;
        io = ioInstance;
        cookie = request.cookie('session_id='+session.session_id);
    }

    sendUpdateSignal() {

    }

    attachIOListeners() {
        //Web Socket Settings
        io.on('connection', (socket) => {

        });
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
            if (changesList.added && changesList.added.length > 0) {    
                for (let key in changesList.added) {
                    ordersArray.push(changesList.added[key])
                }
            }
            if (changesList.removed && changesList.removed.length > 0) {
                for (let xKey in changesList.removed) {
                    for (let yKey in ordersArray) {
                        if (changesList.removed[xKey] === ordersArray[yKey].id) {
                            delete ordersArray[yKey];
                        }
                    }
                }
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
            console.log('=> Response Data');
            console.log(data);
            self.updateAppPurchasesList(JSON.parse(data));
        })
        /*.catch((data) => {
             console.log('CATCH');
        })*/; 
    }

    initLoop() {
        self.requestProcedure();

        setInterval(() => {
            self.requestProcedure();
        }, constants.appSettings.purchaseListRefreshTime);
    }
}

module.exports = OrdersManager;