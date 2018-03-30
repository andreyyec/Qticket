const   constants = require('../config/constants');

class ToolsManager {

    constructor() {

    }

    static logDbError(err, msg = 'accesing the database') {
        console.log('[Error][Database] Error while ' + msg);
        console.log(err);
    }

    static logApplicationError(err, msg = 'Application Error') {
        console.log('[Error][Application] =>' + msg);
        console.log(err);
    }

    static getDocumentFromArray (array, property, value, workingMode = 0) {
        if (array.constructor === Array) {
            let doc = array.filter(x => x[property] === value);
            
            switch (workingMode) {
                case 0:
                    return doc[0];
                    break;
                case 1:
                    return array.findIndex(x => x[property] === value);
                    break;
                case 2:
                    return {document: doc[0], index: array.findIndex(x => x[property] === value)};
                break;
            }
        } else {
            return false;
        }
    }
}

module.exports = ToolsManager;