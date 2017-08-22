const dbMng = require(constants.modelsPath + 'DBManager');

let self,
    dbManager = new dbMng();

class SessionManager {

    constructor() {
        self = this;

    }

    isSessionAlive() {

    }

    isValidSession(session) {
        console.log(session);

        session.isAuth = true;

        return false;
    }

    authenticate(user, password, session) {

    }

    getSessionParams(parameter) {

    }

}

module.exports = SessionManager;