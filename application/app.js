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
        dbMng = require(constants.paths.models + 'DBManager');


//DB settings
let dbManager = new dbMng();

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

//App Router
app.use('/', routes);

//Web Socket Settings
io.on('connection', (socket) => {

});

//Web Server Init
http.listen(port, () => {
    console.log('listening on *:' + port);
});