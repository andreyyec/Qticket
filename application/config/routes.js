const 	constants = require('./constants'),
        express = require('express'),
	 	router = express.Router(),
	 	sessMng = require(constants.paths.models + 'SessionManager'),
        ordersMng = require(constants.paths.models + 'OrdersManager');

let sessionData, ordersManager, 
    sessionManager = new sessMng();

// ====> Rest EndPoints



// ====> Session Routes

router.post('/session/login', (req, res) => {
    let userDataRequest, productsDataRequest,
        userData = req.body,
        authProcess = sessionManager.auth(userData.username, userData.password);

    authProcess.then((loginData) => {
        userDataRequest = sessionManager.getUserData(loginData, req.session);

        userDataRequest.then(() => {
            res.redirect(307, '/session/start');
        })
        .catch((data) => {
            if (data.error) {
                res.redirect('/login?error=3');
            }else{
                res.redirect('/login?error=4');
            }
        });
    })
    .catch((data) => {
        if (data.error) {
            res.redirect('/login?error=1');
        }else{
            res.redirect('/login?error=2');
        }
    });
});

router.post('/session/start', (req, res) => {
    let productsDataRequest;

    if (req.session.user !== undefined) {
        productsDataRequest = sessionManager.getProductsData(req.session);

        productsDataRequest.then(() => {
            res.redirect('/');
        })
        .catch((data) => {
            if (data.error) {
                res.redirect('/login?error=5');
            }else{
                res.redirect('/login?error=6');
            }
        });    
    } else{
        res.redirect('/login?error=1');
    }
});

router.get('/login', (req, res) => {
    if (sessionManager.isValidSession(req.session)) {
        res.redirect('/');
    } else {
        res.render('login', {
            layout: false,
            errorMsg: (req.query.error !== undefined) ? 'Invalid Username or Password' : undefined 
        });
    }
});

router.get('/session/logout', (req, res) => {
    req.session.destroy(function(err) {
        res.redirect('/login');
    });
});

router.get('/test', (req, res) => {
    ordersManager = new ordersMng(req.session);
    
    let testRequest = ordersManager.requestOrderList(req.session);

    testRequest.then(() => {
        res.write('OK');
    })
    .catch((data) => {
         res.write('CATCH');
    });    
});

// ====> Application Routes

    // middleware to check for a valid user session
router.use(function checkUserSession (req, res, next) {
    if (sessionManager.isValidSession(req.session)) {
        sessionData = req.session;
        next();
    } else {
        res.redirect('/login');
    } 
});

router.get('/', (req, res) => {

    res.render('orders', {
        session: sessionData,
        activeTab : 1,
        tabTitle: 'Dashboard - Qticket',
        mainTitle: 'Orders',
        subTitle: 'Dashboard',
        products: req.session.products
        //jsfiles: []
    });
});

router.get('/search', (req, res) => {

    res.render('search', {
        session: sessionData,
        activeTab : 2,
        tabTitle: 'Orders - Qticket',
        mainTitle: 'Search',
        subTitle: '',
        //jsfiles: [],
        sessionData: req.session
    });
});

router.get('/reports', (req, res) => {

    res.render('reports', {
        session: sessionData,
        activeTab : 3,
        tabTitle: 'Reports - Qticket',
        mainTitle: 'Reports',
        subTitle: '',
        //jsfiles: [],
        sessionData: req.session
    });
});

router.get('/settings', (req, res) => {

    res.render('settings', {
        session: sessionData,
        activeTab : 4,
        tabTitle: 'Settings - Qticket',
        mainTitle: 'Settings',
        subTitle: '',
        //jsfiles: [],
        sessionData: req.session
    });
});

    // 404 default route
router.get('*', (req, res) => {
    res.render('404', {
        session: sessionData,
        activeTab : 0,
        tabTitle: 'Not found error - TCSb',
        mainTitle: '',
        subTitle: '',
    });
});

module.exports = router;