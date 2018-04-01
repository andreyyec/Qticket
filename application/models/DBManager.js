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

    /*getOrderById(id) {
        return new Promise((resolve, reject) => {
            let query = orderModel.findOne({id: id});

            orderModel.findOne({id: id}, (err, docs) => {
                if (err) {
                    console.log(err);
                    return false;
                } else {
                    return docs;
                }
            });
        });
    }*/

    getOrderById(id) {
        return orderModel.findOne({id: id}, (err,obj) => {
            if (err) {
                return {status: 'error'};
            } else {
                return {status: 'success', data: obj};
            }
        });
    }

    getOrderByOdooRef(ref) {
        return new Promise((resolve, reject) => {
            orderModel.findOne({odooOrderRef: ref}).lean().exec((err, order) => {
                if (!err) {
                    if(order) {
                        resolve(order);
                    }
                } else {
                    console.log(err);
                }
                resolve(false);
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

    exampleFunctions() {
        let newTestModule = new moduleModel();
        newTestModule.name = 'TestModule';
        newTestModule.restricted = false;

        newTestModule.save((err, data) => {
            if (err) {
                console.log('Error:' + err);
            } else {
                console.log(data);
            }
        });

        //newTestModule.create()

        moduleModel.find({}).exec((err, data) => {
            if (err) {
                console.log('Error');
            }else{
                console.log(data);
            }
        });
    }
}

module.exports = DBManager;