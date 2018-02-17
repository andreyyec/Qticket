const   constants = require('../config/constants');

let self;

class ToolsManager {

    constructor() {
        self = this;
    }

    logDbError(err, msg = 'accesing the database') {
        console.log('[Error][Database] Error while ' + msg);
        console.log(err);
    }

    logApplicationError(err, msg = 'Application Error') {
        console.log('[Error][Application] =>' + msg);
        console.log(err);
    }

    getDocumentFromArray (array, property, value, getIndex = false) {
        if (array.constructor === Array) {
            let doc = array.filter(x => x[property] === value);
            
            if (getIndex) {
                if (doc) {
                    return {document: doc[0], index: array.findIndex(x => x[property] === value)};
                } else {
                    return {document: undefined, index: undefined};    
                }
            }else {
                return doc[0];
            }
        } else {
            return false;
        }
    }
}

module.exports = ToolsManager;