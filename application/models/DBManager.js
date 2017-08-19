
//const MongoClient = require('mongodb').MongoClient;
const   Mongoose = require('mongoose'),
        db = Mongoose.connection;

var self;

class DBManager {

    setup(){
        self = this;

        Mongoose.connect('mongodb://localhost:27017/qticket');

        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function() {
            console.log('DB Connection established');
        });

        /*MongoClient.connect('mongodb://localhost:27017/tcsdb', (err, database) => {
            if (err) {
                console.log('=> Debug => Database connection error');
                return console.log(err);
            }
            self.db = database;
        });*/
    }

    
    constructor() {
        this.setup(); 
    }
}

module.exports = DBManager;