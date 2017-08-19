const 	mongoose = require('mongoose'),
		Schema = mongoose.Schema;

let RoleSchema = new Schema({
	name: String,
	allowedModules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
    }]
});

module.exports = mongoose.model('Role', RoleSchema);