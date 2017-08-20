const	express = require('express'),
		ejsLayouts = require('express-ejs-layouts'),
		app = express(),
		bodyParser = require('body-parser'),
		validator = require('express-validator'),
		session = require('express-session'),
		MongoStore = require('connect-mongo')(session);
		http = require('http').Server(app),
		io = require('socket.io')(http),
		port = process.env.PORT || 3000,
		dbMng = require(__dirname+'/models/DBManager.js');

//DB settings
let dbManager = new dbMng();

//App settings
app.set('views', __dirname+'/views');
app.set('view engine', 'ejs');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use(ejsLayouts);
app.use(bodyParser.json());
app.use(validator());
app.use(session({
  secret: 'Secret String',
  resave: false,
  store: new MongoStore({ mongooseConnection: dbManager.db }),
  saveUninitialized: true
}));
app.use('/public', express.static(__dirname+'/public'));


// --> Routes

//Rest Routes
app.get('/rest/getusers', (req, res) => {
	
});

app.post('/rest/deleteuser', (req, res) => {
	
});

//Application Routes
app.get('/', (req, res) => {

	//res.render('login', {
	//	layout: false,

	res.render('dashboard', {
		activeTab : 1,
    	tabTitle: 'Dashboard - Qticket',
    	mainTitle: 'Dashboard',
    	subTitle: 'Orders',
    	jsfiles: ['io-handler.js']
	});
});

app.get('/settings', (req, res) => {
	res.render('settings', {
    	activeTab : 2,
	    tabTitle: 'Settings - TCSb',
	    mainTitle: 'Settings',
	    subTitle: '',
	    jsfiles: ['bootstrap-modal.js','settings.js']
  	});
});

app.get('*', function(req, res){
   	res.render('404', {
    	activeTab : 0,
		tabTitle: 'Not found error - TCSb',
	 	mainTitle: '',
		subTitle: '',
  	});
});

//Web Socket Settings
io.on('connection', function(socket){

});

//Web Server Settings
http.listen(port, function(){
  	console.log('listening on *:' + port);
});