const   validator = require("check-data-type"),
        constants = require('../config/constants'),
        odooSettings = constants.odooParams;
        

let self, dbInstance;

class RestManager {

    constructor(dbInst) {
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

    validateRequestFilters(filtersList, validationRules) {
        return true;
    }

    processDataTableSummary(data){
        let summary = data;

        for(let i in summary) {
            let objToArray = [], obj = summary[i];
            obj.client = obj.client.name;
            obj.date = obj.activityLog[obj.activityLog.length - 1].date;
            obj.activityLog = undefined;
        }

        return summary;
    }

    getOrdersByFilters(filters = {}, fields = {}, summary = false) {
        return new Promise((resolve, reject) => {
            let validationRules = [{
                name: 'reference',
                type: String,
                maxlenght: 30
            },{
                name: 'date',
                type: Date
            },{
                name: 'ticket',
                type: Number
            }];

            if (self.validateRequestFilters(filters, validationRules)) {
                let result = dbInstance.getOrdersbyFilters(filters, fields, -1);
                
                result.then((data) => {
                    if (!summary) {
                        resolve({data: data})
                    } else {
                        resolve({data: self.processDataTableSummary(data.data)});
                    }
                }).catch((err) => {
                    reject({error: err});
                });
            } else {
                reject({error: 'Invalid Parameters'});
            }
        });
    }
}

module.exports = RestManager;