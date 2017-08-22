const 	mongoose = require('mongoose'),
		Schema = mongoose.Schema;

let OrderSchema = new Schema({
	client: String,
	notes: String,
	orderLines: {
		productName: String,
		productQty: Number,
		productPrice: Number
	},
	createdBy: {     
	  type: mongoose.Schema.Types.ObjectId,
	  ref: "User"
	},
	createdDate: {type: Date, default: Date.now},
	lastModifiedBy: {     
	  type: mongoose.Schema.Types.ObjectId,
	  ref: "User"
	},
	lastModifiedDate: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Order', OrderSchema);