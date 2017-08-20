
//const MongoClient = require('mongodb').MongoClient;
const   Mongoose = require('mongoose'),
        db = Mongoose.connection,
        moduleModel = require('./database/ModuleModel');

var self;

class DBManager {

    constructor() {
        self = this;

        Mongoose.connect('mongodb://localhost:27017/qticket');

        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function() {
            console.log('DB Connection established');
        });

        console.log(moduleModel);

        

        let newTestModule = new moduleModel();
        newTestModule.name = 'TestModule';
        newTestModule.restricted = false;

        newTestModule.save(function(err, data) {
            if (err) {
                console.log('Error:' + err);
            } else {
                console.log(data);
            }
        });

        //newTestModule.create()

        moduleModel.find({}).exec(function(err, data){
            if (err) {
                console.log('Error');
            }else{
                console.log(data);
            }
        });

    }    
}

module.exports = DBManager;