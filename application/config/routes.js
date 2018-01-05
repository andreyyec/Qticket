const 	constants = require('./constants'),
        dbMng = require(constants.paths.models + 'DBManager'),
	 	sessMng = require(constants.paths.models + 'SessionManager'),
        restMng = require(constants.paths.models + 'RestManager'),
        express = require('express'),
        app = express(),
        router = express.Router();

let sessionData, sessionManager = new sessMng(), dbManager = new dbMng(), restManager = new restMng(dbManager);

// ====> Session Routes

router.get('/login', (req, res) => {
    if (sessionManager.sessionValidate(req.session)) {
        res.redirect('/');
    } else {
        res.render('pages/login', {
            layout: false,
            errorMsg: (req.query.error !== undefined) ? 'Invalid Username or Password' : undefined 
        });
    }
});

router.post('/session/login', (req, res) => {
    let userDataRequest, productsDataRequest,
        userData = req.body,
        authProcess = sessionManager.auth(userData.username, userData.password);

    authProcess.then((loginData) => {
        userDataRequest = sessionManager.getUserData(loginData, req.session);

        userDataRequest.then((StickySessionFlag) => {
            if (StickySessionFlag) {
                let year = 1000 * 60 * 60 * 24 * 365;
                req.session.cookie.expires = new Date(Date.now() + year)
                req.session.cookie.maxAge = year;
            }
            res.redirect('/');
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

// ====> Application Routes

    // middleware to check for a valid user session
router.use(function checkUserSession (req, res, next) {
    if (sessionManager.sessionValidate(req.session)) {
        sessionData = req.session;
        next();
    } else {
        res.redirect('/login');
    } 
});

router.get('/', (req, res) => {
    res.render('pages/dashboard', {
        activeTab : 1,
        tabTitle: 'Dashboard - Qticket',
        mainTitle: 'Dashboard',
        subTitle: 'Tickets',
        products: req.app.get('appProducts'),
        jsfiles: ['dashboard'],
        constants: constants.public,
        session: sessionData
    });
});

router.get('/orders', (req, res) => {
    //@TODO render manager / viewer depending on user permissions
    res.render('pages/orders', {
        activeTab : 2,
        tabTitle: 'Orders - Qticket',
        mainTitle: 'Orders',
        subTitle: 'Manager',
        products: req.app.get('appProducts'),
        jsfiles: ['orders'],
        constants: constants.public,
        session: sessionData
    });
});

router.get('/search', (req, res) => {
    res.render('pages/search', {
        activeTab : 3,
        tabTitle: 'Orders - Qticket',
        mainTitle: 'Search',
        subTitle: 'orders',
        cssvendorfiles: ['datatables/datatables.min'],
        jsvendorfiles: ['datatables/datatables.min'],
        jsfiles: ['search'],
        constants: constants.public,
        session: sessionData
    });
});

router.get('/search/details/:orderid', (req, res) => {

    let orderInfo, orderDetails = restManager.getOrderByOdooId(req.params.orderid);
    
    orderDetails.then((data) => {
        orderInfo = data;
    }).catch((err) => {
        orderInfo = err;
        console.log(err);
    }).then(() => {
        res.render('pages/se_order_details', {
            activeTab : 3,
            tabTitle: 'Order Details - Qticket',
            mainTitle: 'Search',
            subTitle: 'Order Details',
            orderInfo: orderInfo,
            jsfiles: ['se_order_details'],
            constants: constants.public,
            session: sessionData
        });
    });
});

router.get('/reports', (req, res) => {
    res.render('pages/reports', {
        activeTab : 4,
        tabTitle: 'Reports - Qticket',
        mainTitle: 'Reports',
        subTitle: 'Main',
        //jsfiles: [],
        constants: constants.public,
        session: sessionData
    });
});

/*router.get('/administration/settings', (req, res) => {
    res.render('pages/settings', {
        activeTab : 5,
        tabTitle: 'Settings - Qticket',
        mainTitle: 'Settings',
        subTitle: '',
        //jsfiles: [],
        constants: constants.public,
        session: sessionData
    });
});*/

router.get('/administration/orders/duplicate', (req, res) => {
    res.render('pages/adm_orders_duplicate', {
        activeTab : 6,
        tabTitle: 'Administration - Qticket',
        mainTitle: 'Administration',
        subTitle: 'Order Duplicate',
        //jsfiles: [],
        constants: constants.public,
        session: sessionData
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy(function(err) {
        res.redirect('/login');
    });
});

//API Endpoints
router.post('/rest/orders/get/', (req, res) => {
    let filters = req.body,
        ordersPrm = restManager.getDataTablesSearchRecords(filters, true);

    ordersPrm.then((data) => {
        res.send(data);
    }).catch((err) => {
        console.log(err);
        res.send({error: 'Unable to pull data from server'});
    });
});

// 404 default route
router.get('*', (req, res) => {
    res.render('pages/404', {
        session: sessionData,
        activeTab : 0,
        tabTitle: 'Not found error - TCSb',
        mainTitle: 'Not Found',
        subTitle: 'Error',
    });
});

module.exports = router;