const 	mongoose = require('mongoose'),
		Schema = mongoose.Schema;

let ModuleSchema = new Schema({
	name: String
});

module.exports = mongoose.model('Module', ModuleSchema);