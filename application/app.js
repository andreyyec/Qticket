const   express = require('express'),
        ejsLayouts = require('express-ejs-layouts'),
        app = express(),
        bodyParser = require('body-parser'),
        session = require('express-session'),
        MongoStore = require('connect-mongo')(session), 
        http = require('http').Server(app),
        io = require('socket.io')(http),
        constants = require('./config/constants'),
        routes = require('./config/routes'),
        port = constants.public.port || 3000,
        dbMng = require(constants.paths.models + 'DBManager'),
        sessinMng = require(constants.paths.models + 'SessionManager'),
        prodsMng = require(constants.paths.models + 'ProductsManager'),
        ordersMng = require(constants.paths.models + 'OrdersManager');


function debbuger(msg) {
    console.log(`[Debug] => ${msg}`);
}

function exitHandler(options, dbManager) {
    if (options.cleanup) console.log('clean');
    if (options.exit) process.exit();
    dbManager.disconnect();
}

//DB settings
let authProcess, ordersManager, productsManager, sessionManager = new sessinMng(), dbManager = new dbMng();

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
    rolling: true,
    cookie: {expires: false}
}));

/*Starts DB Connection*/
dbManager.connect();

//App -> Odoo Purchases List Init
authProcess = sessionManager.auth(constants.adminAccount.username, constants.adminAccount.password);
debbuger('Connecting with Odoo Server');

authProcess.then((loginData) => {
    debbuger('Connected');
    debbuger('Fetching products information from Odoo Server');

    let productsDataRequest;

    if (loginData && loginData.session_id) {
        productsManager = new prodsMng(loginData);
        productsDataRequest = productsManager.requestProductsData();
        
        productsDataRequest.then((productsData) => {
            debbuger('Fetched');
            app.set('appProducts', productsData);
            ordersManager = new ordersMng(loginData, dbManager,io.of('/orders'), io.of('/dashboard'));
            ordersManager.initLoop();

            //App Router
            app.use('/', routes);

            //Web Server Init
            http.listen(port, () => {
                console.log('listening on *:' + port);
            });
        }).catch((err) => {
            debbuger('Unable to fetch products from Odoo');
        });
    }else {
        debbuger('Error while trying to access global data');
    }
}).catch((data) => {
    debbuger('Unable to connect with Odoo Server');
});


/*CleanUP Procedures*/

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}, dbManager));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}, dbManager));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}, dbManager));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}, dbManager));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}, dbManager));

