const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        dbMng = require(constants.paths.models + 'DBManager'),
        http = require('http'),
        request = require('request');

let self,
    dbManager = new dbMng();

class SessionManager {

    constructor() {
        self = this;
    }

    isValidSession(session) {
        return (session !== undefined && session.user !== undefined && session.user.uid && session.user.username) ? true : false;
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
        return new Promise((resolve, reject) => {
            let restServPath = '/rest/users/get/'+user.username,
                cookie = request.cookie('session_id='+user.session_id),
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
}

module.exports = SessionManager;