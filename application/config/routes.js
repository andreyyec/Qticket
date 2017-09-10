const 	constants = require('./constants'),
        express = require('express'),
	 	router = express.Router(),
	 	sessMng = require(constants.paths.models + 'SessionManager');

let sessionData,
    sessionManager = new sessMng();


// ====> Rest EndPoints



// ====> Session Routes

router.post('/session/login', (req, res) => {
    let userData = req.body,
        userRequestProcess,
        authProcess = sessionManager.auth(userData.username, userData.password);

    authProcess.then((loginData) => {
        userRequestProcess = sessionManager.getUserData(loginData, req.session);

        userRequestProcess.then(() => {
            res.redirect('/');
        })
        .catch((data) => {
            if (data.error) {
                res.redirect('/login?error=2');
            }else{
                res.redirect('/login?error=3');
            }
        });
    })
    .catch((data) => {
        if (data.error) {
            res.redirect('/login?error=1');
        }else{
            res.redirect('/login?error=3');
        }
    });
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
    })
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
    res.render('orders_dashboard', {
        session: sessionData,
        activeTab : 1,
        tabTitle: 'Dashboard - Qticket',
        mainTitle: 'Orders',
        subTitle: 'Dashboard',
        jsfiles: ['io-handler.js']
    });
});

router.get('/search', (req, res) => {
    res.render('search', {
        session: sessionData,
        activeTab : 2,
        tabTitle: 'Orders - Qticket',
        mainTitle: 'Search',
        subTitle: '',
        jsfiles: ['bootstrap-modal.js','settings.js'],
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
        jsfiles: ['bootstrap-modal.js','settings.js'],
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
        jsfiles: ['bootstrap-modal.js','settings.js'],
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