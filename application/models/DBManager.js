const   constants = require('../config/constants'),
        Mongoose = require('mongoose'),
        db = Mongoose.connection,
        moduleModel = require(constants.paths.dbModels+'ModuleModel'),
        userModel = require(constants.paths.dbModels+'UserModel');

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

    exampleGetUser(uname, pswd) {
        return userModel.findOne({username: uname, password:pswd}, (err,obj) => { 
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

    //===> Get all records methods

    getModules() {

    }

    getUsers() {

    }

    getRoles() {

    }

    getOrders() {

    }

    //===> Save record methods

    saveModule() {

    }

    saveOrder() {

    }

    saveRole() {

    }

    saveUser() {

    }
}

module.exports = DBManager;