const   mongoose = require('mongoose'),
        Schema = mongoose.Schema;

let OrderSchema = new Schema({
    odooOrderRef: String,
    orderState: Number,
    ticketNumber: Number,
    createdOn: Date,
    client: {
        id: String, 
        name: String
    },
    productRows: [{
        id: Number,
        name: String,
        qty: Number,
        price: Number
    }],
    activityLog: [{
        user: {
            uid: Number,
            username: String,
        }, 
        date: Date, 
        changeLogs: [{
            atype: String,
            id: Number,
            product: String,
            action: String,
            qty: Number,
            price: Number
        }],
    }]
});

module.exports = mongoose.model('Order', OrderSchema);