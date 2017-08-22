const constants = {
	rootPath: __dirname.replace('config',''),
	modelsPath: __dirname.replace('config','models/'),
	dbModelsPath: __dirname.replace('config','models/database/'),
	database: {
		mongooseConnectionString: 'mongodb://localhost:27017/qticket',
		mongoConnectionString: ''
	}
}

module.exports = constants;