const 	constants = require('./constants'),
	 	sessMng = require(constants.paths.models + 'SessionManager'),
        ordersMng = require(constants.paths.models + 'OrdersManager'),
        express = require('express'),
        router = express.Router();

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

router.get('/logout', (req, res) => {
    req.session.destroy(function(err) {
        res.redirect('/login');
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
    res.render('dashboard', {
        activeTab : 1,
        tabTitle: 'Dashboard - Qticket',
        mainTitle: 'Tickets',
        subTitle: 'Dashboard',
        products: req.session.products,
        jsfiles: ['io-handler'],
        session: sessionData,
    });
});

router.get('/orders', (req, res) => {
    //@TODO render manager / viewer depending on user permissions
    res.render('orders', {
        activeTab : 2,
        tabTitle: 'Orders - Qticket',
        mainTitle: 'Orders',
        subTitle: 'Manager',
        products: req.session.products,
        jsfiles: ['io-handler'],
        session: sessionData,
    });
});

router.get('/search', (req, res) => {
    res.render('search', {
        activeTab : 3,
        tabTitle: 'Orders - Qticket',
        mainTitle: 'Search',
        subTitle: '',
        //jsfiles: [],
        session: sessionData,
    });
});

router.get('/reports', (req, res) => {
    res.render('reports', {
        activeTab : 4,
        tabTitle: 'Reports - Qticket',
        mainTitle: 'Reports',
        subTitle: '',
        //jsfiles: [],
        session: sessionData,
    });
});

/*router.get('/settings', (req, res) => {
    res.render('settings', {
        activeTab : 5,
        tabTitle: 'Settings - Qticket',
        mainTitle: 'Settings',
        subTitle: '',
        //jsfiles: [],
        session: sessionData,
    });
});*/

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