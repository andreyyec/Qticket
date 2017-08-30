const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        dbMng = require(constants.paths.models + 'DBManager'),
        http = require('http');

let self,
    dbManager = new dbMng();

class SessionManager {

    constructor() {
        self = this;
    }

    isValidSession(session) {
        return (session.uid && session.username) ? true : false;
    }

    auth(username, password, session) {
        let authPromise,
            req,
            params = {
                'db': odooSettings.db, 
                'login': username,
                'password': password,
                'base_location': odooSettings.protocol+'://'+odooSettings.host+':'+odooSettings.port,
                //'session_id': "",
                'context': {}
            },
            json = JSON.stringify({
                'jsonrpc': '2.0',
                'method': 'call',
                'params': params
            }),
            options = {
                'host': odooSettings.host,
                'port': odooSettings.port,
                'path': '/web/session/authenticate',
                'method': 'POST',
                'headers': {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Content-Length": json.length,
                }
            };

        return authPromise = new Promise((resolve, reject) => {
            req = http.request(options, (res) => {
                let err, response,
                    sid = res.headers['set-cookie'][0].split(';')[0];

                res.setEncoding('utf8');
                
                res.on('data', (data) => {
                    let jsonData = JSON.parse(data),
                        user = jsonData.result;

                    if (user.uid !== false) {
                        session.uid = user.uid;
                        session.username = user.username;
                        session.userData = user;
                       resolve();
                    }else{
                        reject({error: "Invalid Username or password"});
                    }
                });

                res.on('error', (data) => {
                    reject();
                });
            });

            req.write(json);
        });
    }

    userAuthExample() {

        // find the user
        User.findOne({
            name: req.body.name
        }, function(err, user) {

            if (err) throw err;

            if (!user) {
                res.json({ success: false, message: 'Authentication failed. User not found.' });
            } else if (user) {
                // check if password matches
                if (user.password != req.body.password) {
                    res.json({ success: false, message: 'Authentication failed. Wrong password.' });
                } else {
                    // if user is found and password is right
                    // create a token
                    var token = jwt.sign(user, app.get('superSecret'), {
                        expiresInMinutes: 1440 // expires in 24 hours
                    });

                    // return the information including token as JSON
                    res.json({
                        success: true,
                        message: 'Enjoy your token!',
                        token: token
                    });
                }
            }
        });
    }

}

module.exports = SessionManager;