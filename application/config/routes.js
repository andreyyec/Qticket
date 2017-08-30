const 	constants = require('./constants'),
        express = require('express'),
	 	router = express.Router(),
	 	sessMng = require(constants.paths.models + 'SessionManager');

let sessionData,
    sessionManager = new sessMng();


// ====> Rest EndPoints

router.get('/rest/users/getuser', (req, res) => {

});

router.get('/rest/users/getusers', (req, res) => {

});

router.post('/rest/users/deleteuser', (req, res) => {
    
});

// ====> Session Routes

router.post('/session/login', (req, res) => {
    let userData = req.body,
        authProcess = sessionManager.auth(userData.username, userData.password, req.session);

    authProcess.then((data) => {
        res.redirect('/');
    })
    .catch((data) => {
        if (data.error) {
            res.test = 'testString';
            res.redirect('/login?error=1');
        }else{
            res.redirect('/login');
        }
    });
});

router.get('/session/logout', (req, res) => {
    req.session.destroy(function(err) {
        // cannot access session here
        res.redirect('/login');
    })
});

// ====> Page Routes

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
        session: sessionData,
        activeTab : 1,
        tabTitle: 'Dashboard - Qticket',
        mainTitle: 'Dashboard',
        subTitle: 'Orders',
        jsfiles: ['io-handler.js']
    });
});

router.get('/settings', (req, res) => {
    res.render('settings', {
        session: sessionData,
        activeTab : 2,
        tabTitle: 'Settings - TCSb',
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