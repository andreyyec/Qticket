const 	constants = require('./constants'),
	 	sessMng = require(constants.paths.models + 'SessionManager'),
        express = require('express'),
        app = express(),
        router = express.Router();

let sessionData, sessionManager = new sessMng();

// ====> Session Routes

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

router.get('/login', (req, res) => {
    if (sessionManager.isValidSession(req.session)) {
        res.redirect('/');
    } else {
        res.render('pages/login', {
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
        subTitle: 'Order',
        //jsfiles: [],
        constants: constants.public,
        session: sessionData
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

/*router.get('/settings', (req, res) => {
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