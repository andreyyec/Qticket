const 	mongoose = require('mongoose'),
		Schema = mongoose.Schema;

let UserSchema = new Schema({
	name: String,
	username: String,
	password: String,
	author: {     
	  type: mongoose.Schema.Types.ObjectId,
	  ref: "Role"
	}
});

module.exports = mongoose.model('User', UserSchema);