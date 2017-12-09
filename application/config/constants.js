const constants = {
	public: {
		protocol: 'http',
		hostname: '192.168.2.47:3000',
		//hostname: 'localhost:3000',
		basePath: function(){this.basePath = this.protocol+'://'+this.hostname+'/'}
	},
	adminAccount: {
		username: 'admin',
		password: 'admin'
	},
	appSettings: {
		purchaseListRefreshTime: 2, //seconds
		sessionDurationTime: 30 //minutes
	},
	database: {
		mongooseConnectionString: 'mongodb://localhost:27017/qticket',
		dbHost: 'localhost',
		dbName: 'qticket',
		dbPort: 27017,
		dbOptions: {}
	},
	odooParams: {
		protocol: 'http',
		host: '34.210.127.118',
		port: '8070',
		db: 'andrey'
	},
	paths: {
		root: __dirname.replace('config',''),
		models: __dirname.replace('config','models/'),
		dbModels: __dirname.replace('config','models/database/'),
	},
	secure: {
		secret: 'R3c1C1aD0rASaNm1Gu3L'
	}
}

constants.public.basePath();

module.exports = constants;