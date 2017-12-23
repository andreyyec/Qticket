const   constants = require('../config/constants'),
        odooSettings = constants.odooParams,
        http = require('http'),
        request = require('request');

let self, dbInstance;

class RestManager {

    constructor(session, dbInst, ioOrdersInstance, ioDashbInstance) {
        self = this;
        dbInstance = dbInst;
    }

    logDbError(err, msg = 'processing') {
        console.log('Error while ' + msg);
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

    getAjaxData(requestParams){
        return dbInstance.getOrders(requestParams);
    }
}

module.exports = OrdersManager;