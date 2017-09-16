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

    /*getGlobalDraftsArray() {
        let obj = JSON.parse(process.env.globalDraftsList);

        if (obj) {
    	   return obj;
        } else {
            return [];
        }
    }

    setGlobalDraftsArray(object) {
        process.env.globalDraftsList = JSON.stringify(object);
    }*/

    attachIOListeners() {
        //Web Socket Settings
        io.on('connection', (socket) => {

        });
    }

    getIdslist() {

    }

    requestOrderList() {
        return new Promise((resolve, reject) => {
            let restServPath = '/rest/purchases/drafts/list',
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
					        	ids: ordersArray
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
            console.log('=>data');
            console.log(data);
        })
        .catch((data) => {
             console.log('CATCH');
        }); 
    }

    initLoop() {
        self.requestProcedure();
        
        setInterval(() => {
            self.requestProcedure();
        }, 5000);
    }
}

module.exports = OrdersManager;