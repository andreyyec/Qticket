const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        dbMng = require(constants.paths.models + 'DBManager'),
        http = require('http'),
        request = require('request');

let self, cookie, ordersArray = ['test1', 'test2', 'test3'];

class OrdersManager {

    constructor(session) {
        self = this;
        cookie = request.cookie('session_id='+session.session_id);
    }

    getOrdersIds() {
    	
    }

    sendUpdateSignal() {

    }

    requestOrderList() {
        return new Promise((resolve, reject) => {
            let restServPath = '/odoo/test',
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
                    /*let sessionProductsArray = [],
                        productsDataArray = JSON.parse(body);*/

                    console.log(body);

                    resolve();
                } else {
                    reject();
                }
            });
        });
    }
}

module.exports = OrdersManager;