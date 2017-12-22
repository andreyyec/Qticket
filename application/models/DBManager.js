const   constants = require('../config/constants'),
        Mongoose = require('mongoose'),
        db = Mongoose.connection,
        moduleModel = require(constants.paths.dbModels+'ModuleModel'),
        orderModel = require(constants.paths.dbModels+'OrderModel');

let self;

class DBManager {

    constructor() {
        self = this;

        Mongoose.connect(constants.database.dbConnString);

        self.db = db;

        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('openUri', () => {
            console.log('DB Connection established');
        });
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

    exampleGetOrder(id) {
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