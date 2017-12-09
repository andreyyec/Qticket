const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        dbMng = require(constants.paths.models + 'DBManager'),
        http = require('http'),
        request = require('request');

let self, cookie,
    dbManager = new dbMng();

class SessionManager {

    constructor() {
        self = this;
    }

    getMinutesDiff(lastModified) {
        return Math.floor((Math.abs(new Date().getTime() - new Date(lastModified).getTime())/1000)/60);
    }

    isValidSession(session) {
        if (!session.isStickySession) {
            return (session && session.user && session.lastModified && self.getMinutesDiff(session.lastModified) <= constants.appSettings.sessionDurationTime) ? true : false;
        } else {
            return (session && session.user) ? true : false;
        }
    }

    sessionValidate(session) {
        let isValid = self.isValidSession(session);
        if (isValid) {
            session.lastModified = new Date();
        } else {
            session.user = undefined;
            session.lastModified = undefined;
        }
        return isValid;
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
                    let dashBUser = false,
                        jsonData = JSON.parse(body),
                        userData = jsonData[0];

                    session.session_id = user.session_id;

                    session.user = {
                        uid: user.uid,
                        username: userData.login,
                        displayname: userData.display_name,
                        role: userData.purchase_type_user,
                        userData: userData
                    };

                    session.lastModified = new Date();

                    if (userData.purchase_type_user === 'tablero') {
                        let year = 1000 * 60 * 60 * 24 * 365;
                        session.isStickySession = true;
                        req.session.cookie.expires = new Date(Date.now() + year)
                        req.session.cookie.maxAge = year;
                    }

                    resolve(dashBUser);
                } else {
                    reject();
                }
            });
        });
    }
}

module.exports = SessionManager;