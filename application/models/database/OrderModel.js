const 	mongoose = require('mongoose'),
		Schema = mongoose.Schema;

let OrderSchema = new Schema({
	client: String,
	notes: String,
	odooRef: String,
	orderLines: [{
		productName: String,
		productQty: Number,
		productPrice: Number
	}],
	activityRegistry: [{
		user:String, 
		date: Date, 
		activityLogs: [{
			product:String,
			action:String,
			info: String
		}],
	}],
	userDefinedState: String
});

module.exports = mongoose.model('Order', OrderSchema);