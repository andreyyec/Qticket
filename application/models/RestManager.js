const   validator = require("check-data-type"),
        constants = require('../config/constants'),
        odooSettings = constants.odooParams;
        

let self, dbInstance;

class RestManager {

    constructor(dbInst) {
        self = this;
        dbInstance = dbInst;
    }

    validateRequestFilters(filtersList, validationRules) {
        let result = true;

        for(let i in validationRules) {
            let cRule = validationRules[i],
                cFilter = filtersList[cRule.name];

            if (result && cFilter) {
                switch(cRule.type) {
                    case String:
                        if (typeof cFilter === 'string') {
                            if (cRule.maxlenght) {
                                if (cFilter.length > cRule.maxlenght) {
                                    result = false;
                                }
                            }
                        } else { result = false; };
                        break;
                    case Date:
                        if (result && (Date.parse(cFilter) === NaN)) result = false;
                        break;
                    case Boolean:
                        if (result && !(cFilter === 'true' || cFilter === 'false')) result = false;
                        break;
                    default:
                        result = false;
                        break;
                }
            }
        }
        return result;
    }

    processDataTablesDbFilters(filtersList) {
        let queryObj = {};

        if (filtersList.orderRef) {
            queryObj['odooOrderRef'] = { $regex: '.*' + filtersList.orderRef + '.*' };
        }
        if (filtersList.client) {
            queryObj['client.name'] = { $regex: '.*' + filtersList.client + '.*' };
        }
        if (filtersList.date) {
            let fDate = new Date(filtersList.date),
                nextDay = new Date();

            nextDay.setDate(fDate.getDate()+1);

            queryObj['activityLog'] = { $all: [{ "$elemMatch" : { date: {"$gte": fDate, "$lt": nextDay} } }] };
        }

        return queryObj;
    }

    getOrdersDate(data) {
        for(let i in data) {
            data[i].date = data[i].activityLog[data[i].activityLog.length - 1].date;
        }
        return data;
    }

    processDataTableSummary(data){
        for(let i in data) {
            data[i].client = data[i].client.name;
            data[i].activityLog = undefined;
        }
        return data;
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
                    data = self.getOrdersDate(data);
                    if (data[0]) {
                        resolve(data[0]);
                    } else {
                        resolve(data);
                    }
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
            const fields = {'_id':1, 'odooOrderRef':1, 'client':1, 'ticketNumber':1, 'orderState':1, 'activityLog':1},
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
                },{
                    name: 'all',
                    type: Boolean
                }];

            if (self.validateRequestFilters(filters, validationRules)) {
                let limit = (filters.all) ? 0 : 200,
                    result = dbInstance.getOrdersbyFilter(self.processDataTablesDbFilters(filters), fields, -1, limit);

                result.then((data) => {
                    data = self.getOrdersDate(data);
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