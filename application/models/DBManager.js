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

    saveOrder(nOrderData, prevSaved = false) {
        return new Promise((resolve, reject) => {
            let result, order = new orderModel(nOrderData);

            if (!prevSaved) {
                order.save((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            } else {
                orderModel.findOneAndUpdate({odooOrderRef: nOrderData.odooOrderRef}, nOrderData, (err)=> {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
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

    getOrderById(id) {
        return orderModel.findOne({id: id}, (err,obj) => {
            if (err) {
                return {status: 'error'};
            } else {
                return {status: 'success', data: obj};
            }
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