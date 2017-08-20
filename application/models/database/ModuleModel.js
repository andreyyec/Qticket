const mongoose = require('mongoose'),
		Schema = mongoose.Schema;

let ModuleSchema = new Schema({
	name: String,
	restricted: Boolean,
	active: Boolean
});

module.exports = mongoose.model('Module', ModuleSchema);