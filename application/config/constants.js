const constants = {
	secure: {
		secret: 'R3c1C1aD0rASaNm1Gu3L'
	},
	paths: {
		root: __dirname.replace('config',''),
		models: __dirname.replace('config','models/'),
		dbModels: __dirname.replace('config','models/database/'),
	},
	odooParams: {
		protocol: 'http',
		host: '34.210.127.118',
		port: '8070',
		db: 'andrey'
	},
	database: {
		mongooseConnectionString: 'mongodb://localhost:27017/qticket',
		mongoConnectionString: '',
		dbHost: 'localhost',
		dbName: 'qticket',
		dbPort: 27017,
		dbOptions: {}
	}
}

module.exports = constants;