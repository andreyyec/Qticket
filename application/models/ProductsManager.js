const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        http = require('http'),
        request = require('request');

let self, cookie, productsArray;

class ProductsManager {

    constructor(serverSession) {
        self = this;
        cookie = request.cookie('session_id='+serverSession.session_id);
    }

    getProductsData() {
        return productsArray;
    }

    requestProductsData() {
        return new Promise((resolve, reject) => {
            let restServPath = '/rest/products/qticket/',
                opts = {
                    url : odooSettings.protocol+'://'+odooSettings.host+':'+odooSettings.port + restServPath,
                    method: 'GET',
                    headers: {
                        Cookie: cookie
                    },
                };

            request.get(opts, function (error, response, body) {
                if (!error) {
                    let sessionProductsArray = [],
                        productsDataArray = JSON.parse(body);

                    for (let i in productsDataArray) {
                        let odooProductObject = productsDataArray[i],
                            productObject = {
                                id: odooProductObject.id,
                                name: odooProductObject.display_name,
                                price: odooProductObject.standard_price,
                                image: odooProductObject.image_medium
                            };
                        sessionProductsArray.push(productObject);
                    }
                    
                    productsArray = sessionProductsArray;

                    resolve(sessionProductsArray);
                } else {
                    reject(error);
                }
            });
        });
    }
}

module.exports = ProductsManager;