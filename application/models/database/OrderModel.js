const 	mongoose = require('mongoose'),
		Schema = mongoose.Schema;

let OrderSchema = new Schema({
	available: String,
	odooOrderRef: String,
	ticketNumber: Number,
	client: {
		id: String, 
		name: String
	},
	productRows: [{
		productName: String,
		productQty: Number,
		productPrice: Number
	}],
	activityRows: [{
		user: {
			uid: Number,
			username: String,
		}, 
		date: Date, 
		activityLogs: [{
			product:String,
			action:String,
			qty: Number,
            price: Number
		}],
	}]
});

module.exports = mongoose.model('Order', OrderSchema);