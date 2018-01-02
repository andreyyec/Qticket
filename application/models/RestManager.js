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

    getOrderByOdooId(id) {
        return new Promise((resolve, reject) => {
            let filters = {'odooOrderRef': id},
                validationRules = [{
                    name: 'odooOrderRef',
                    type: String,
                    maxlenght: 30
                }];

            if (self.validateRequestFilters(filters, validationRules)) {
                let result = dbInstance.getOrdersbyFilter(filters);
                
                result.then((data) => {
                    resolve(data)
                }).catch((err) => {
                    reject({error: err});
                });
            } else {
                reject({error: 'Invalid Parameters'});
            }
        });
    }

    getDataTablesSearchRecords(filters = {}) {
        return new Promise((resolve, reject) => {
            let fields = {'_id':1, 'odooOrderRef':1, 'client':1, 'ticketNumber':1, 'orderState':1, 'activityLog':1},
                validationRules = [{
                    name: 'orderRef',
                    type: String,
                    maxlenght: 30
                },{
                    name: 'client',
                    type: String,
                    maxlenght: 30
                },{
                    name: 'date',
                    type: Date
                }];

            //db.users.find({"name": /.*m.*/})

            if (self.validateRequestFilters(filters, validationRules)) {
                let result = dbInstance.getOrdersbyFilter(filters, fields, -1);
                
                result.then((data) => {
                    resolve({data: self.processDataTableSummary(data)});
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