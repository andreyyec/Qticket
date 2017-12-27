const constants = {
	public: {
		protocol: 'http',
		hostname: '192.168.1.108',
		port: 3000,
		basePath: ''
	},
	appSettings: {
		//purchaseListRefreshTime: 2, //seconds
		purchaseListRefreshTime: 10, //seconds
		sessionDurationTime: 30 //minutes
	},
	adminAccount: {
		username: 'admin',
		password: 'admin'
	},
	database: {
		host: 'localhost',
		name: 'qticket',
		port: 27017,
		options: {},
		dbConnString: ''
	},
	odooParams: {
		protocol: 'http',
		host: '52.41.145.237',
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
}, 
utils = {
	getBasePath: () => {return `${constants.public.protocol}://${constants.public.hostname}:${constants.public.port}/`},
	getDBConnString: () => {return `mongodb://${constants.database.host}:${constants.database.port}/${constants.database.name}`}
};

constants.public.basePath = utils.getBasePath();
constants.database.dbConnString = utils.getDBConnString();

module.exports = constants;