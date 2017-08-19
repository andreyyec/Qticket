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
	createdDate: Date
	lastModifiedBy: {     
	  type: mongoose.Schema.Types.ObjectId,
	  ref: "User"
	},
	lastModifiedDate: Date
});

module.exports = mongoose.model('Order', OrderSchema);