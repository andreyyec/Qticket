const   constants = require('../config/constants'),
        Mongoose = require('mongoose'),
        db = Mongoose.connection,
        moduleModel = require(constants.paths.dbModels+'ModuleModel'),
        orderModel = require(constants.paths.dbModels+'OrderModel');

let self;

class DBManager {

    constructor() {
        self = this;

        Mongoose.connect(constants.database.mongooseConnectionString);

        self.db = db;

        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('openUri', () => {
            console.log('DB Connection established');
        });
    }

    saveOrder(nOrderData, oID) {
        return new Promise((resolve, reject) => { 
            let result, order = new orderModel(nOrderData);

            console.log('order');
            console.log(order);
            console.log('nOrderData');
            console.log(nOrderData);

            if (oID === undefined) {
                order.save((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            } else {
                /*let query = {odooOrderRef: nOrderData.odooOrderRef};

                order.findOneAndUpdate(query, nOrderData, (err)=> {
                    result = (err) ? true : false;
                    console.log('Error while trying to save in the database');
                    console.log(err);
                });*/
                console.log('on update event');
            }
        });
    }

    exampleGetOrder(id) {
        return orderModel.findOne({id: id}, (err,obj) => { 
            console.log(obj);
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