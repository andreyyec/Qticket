const   express = require('express'),
        ejsLayouts = require('express-ejs-layouts'),
        app = express(),
        bodyParser = require('body-parser'),
        session = require('express-session'),
        MongoStore = require('connect-mongo')(session), 
        http = require('http').Server(app),
        io = require('socket.io')(http),
        port = process.env.PORT || 3000,
        constants = require('./config/constants'),
        routes = require('./config/routes'),
        dbMng = require(constants.paths.models + 'DBManager'),
        sessinMng = require(constants.paths.models + 'SessionManager'),
        ordersMng = require(constants.paths.models + 'OrdersManager');


//DB settings
let authProcess, ordersManager, sessionManager = new sessinMng(), dbManager = new dbMng();

//App environment settings
process.env.globalDraftsList = '';

//App settings
app.set('views', __dirname+'/views');
app.set('view engine', 'ejs');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use(ejsLayouts);
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use('/public', express.static(__dirname+'/public'));
app.use(session({
    secret: constants.secure.secret,
    resave: false,
    store: new MongoStore({mongooseConnection:dbManager.db}),
    saveUninitialized: true,
    cookie: {expires: new Date(Date.now() + 3600000)}
}));

//App -> Odoo
    authProcess = sessionManager.auth(constants.adminAccount.username, constants.adminAccount.password);

    authProcess.then((loginData) => {
        if (loginData && loginData.session_id) {
            ordersManager = new ordersMng(loginData, io);
            ordersManager.initLoop();
        }else {
            console.log('Error while trying to access global data');
        }
    })/*.catch((data) => {
        console.log('Unable to access global data');
    })*/;

//App Router
app.use('/', routes);

//Web Server Init
http.listen(port, () => {
    console.log('listening on *:' + port);
});