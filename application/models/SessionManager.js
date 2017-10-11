const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        dbMng = require(constants.paths.models + 'DBManager'),
        http = require('http'),
        request = require('request');

let self, cookie
    dbManager = new dbMng();

class SessionManager {

    constructor() {
        self = this;
    }

    isValidSession(session) {
        return (session !== undefined && session.user !== undefined && session.products !== undefined) ? true : false;
    }

    auth(username, password) {
        let json = JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    db: odooSettings.db, 
                    login: username,
                    password: password,
                    base_location: odooSettings.protocol+'://'+odooSettings.host+':'+odooSettings.port,
                    context: {}
                }
            }),
            options = {
                host: odooSettings.host,
                port: odooSettings.port,
                path: '/web/session/authenticate',
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Content-Length': json.length,
                }
            };

        return new Promise((resolve, reject) => {
            let request = http.request(options, (response) => {
                response.setEncoding('utf8');
                
                response.on('data', (data) => {
                    let jsonData = JSON.parse(data),
                        user = jsonData.result;

                    if (user.uid !== false) {
                        resolve(user);
                    }else{
                        reject({error: "Invalid Username or password"});
                    }
                });

                response.on('error', (data) => {
                    reject();
                });
            });
            request.write(json);
        });
    }

    getUserData(user, session) {
        cookie = request.cookie('session_id='+user.session_id);

        return new Promise((resolve, reject) => {
            let restServPath = '/rest/users/get/'+user.username,
                opts = {
                    url : odooSettings.protocol+'://'+odooSettings.host+':'+odooSettings.port + restServPath,
                    method: 'GET',
                    headers: {
                        Cookie: cookie
                    },
                };

            request.get(opts, function (error, response, body) {
                if (error === null) {
                    let jsonData = JSON.parse(body),
                        userData = jsonData[0];

                    session.session_id = user.session_id;
                    session.user = {
                        uid: user.uid,
                        username: userData.login,
                        displayname: userData.display_name,
                        role: userData.purchase_type_user,
                        userData: userData
                    };
                    
                    resolve();
                } else {
                    reject();
                }
            });
        });
    }

    getProductsData(session) {
        return new Promise((resolve, reject) => {
            let restServPath = '/rest/products/all/',
                opts = {
                    url : odooSettings.protocol+'://'+odooSettings.host+':'+odooSettings.port + restServPath,
                    method: 'GET',
                    headers: {
                        Cookie: cookie
                    },
                };

            request.get(opts, function (error, response, body) {
                if (error === null) {
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

                    session.products = sessionProductsArray;

                    resolve();
                } else {
                    reject();
                }
            });
        });
    }
}

module.exports = SessionManager;