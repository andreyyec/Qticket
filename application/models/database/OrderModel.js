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
	activityLogs: [{user:String, body: String, date: Date}],
	userDefinedState: String
});

module.exports = mongoose.model('Order', OrderSchema);