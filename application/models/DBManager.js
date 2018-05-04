const   constants = require('../config/constants'),
        Mongoose = require('mongoose'),
        db = Mongoose.connection,
        orderModel = require(constants.paths.dbModels+'OrderModel');

let self;

class DBManager {

    constructor() {
        self = this;
        self.db = db;
    }

    connect() {
        Mongoose.connect(constants.database.dbConnString, { useMongoClient: true });

        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('openUri', () => {
            console.log('DB Connection established');
        });
    }

    disconnect() {
        db.close();
    }

    static getWSocketInf(elem) {
    	return {
    		id: elem.odooOrderRef,
    		client: elem.client,
    		ticket: elem.ticket,
    		state: dbStates[elem.state],
    		blocked: (elem.isAvailable()) ? false : elem.blocked.user,
    		productRows: (elem.productRows.length > 0) ? elem.productRows : undefined
    	}
    }

    getOrderByOdooRef(ref) {
        return new Promise((resolve, reject) => {
            orderModel.findOne({odooOrderRef: ref}).lean().exec((err, order) => {
                if (err) {
                    reject(err);
                } else {
                    if(order) {
                        resolve(order);
                    } else {
                        resolve(false);
                    }
                }
            });
        });
    }

    saveOrder(orderData) {
        return new Promise((resolve, reject) => {
            orderModel.findOneAndUpdate({odooOrderRef: orderData.odooOrderRef}, orderData, {upsert:true}, (err, order)=> {    
                if (err) {
                    reject(err);
                } else {  
                    resolve(true);
                }
            });
        });
    }

    _orderSave(order) {
        order.save((err) => {
            if (err) {
                console.log(err);
                return false;
            } else {
                return true;
            }
        });
    }

    _orderFindAndUpdate(order) {
        orderModel.findOneAndUpdate({odooOrderRef: order.odooOrderRef}, order, (err)=> {
            if (err) {
                console.log(err);
                return false;
            } else {
                return true;
            }
        });
    }

    getDraftsDbInfo(draftsIdsArray) {
        return new Promise((resolve, reject) => {
            if (draftsIdsArray) {
                orderModel.find({'odooOrderRef': { $in: draftsIdsArray}} ,(err, docs) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(docs);
                    }
                });
            } else {
                reject('No IDs specified');
            }
        });
    }

    getOrdersbyFilter(filters = {}, fields = {}, order = 1, limit = 200) {
        return new Promise((resolve, reject) => {
            let query = orderModel.find(filters, fields).sort({$natural: order}).lean().limit(limit);

            query.exec(function (err, docs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }
}

module.exports = DBManager;