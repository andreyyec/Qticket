const 	constants = require('./constants'),
        express = require('express'),
	 	router = express.Router(),
	 	sessMng = require(constants.paths.models + 'SessionManager');

let sessionManager = new sessMng();


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

router.post('/session/logout', (req, res) => {
    
});

// ====> Page Routes

router.get('/login', (req, res) => {
    console.log('=>Query:');
    console.log(req.query);
    if (sessionManager.isValidSession(req.session)) {
        res.redirect('/');
    } else {
        res.render('login', {
            layout: false,
        });
    }
});


// middleware to check for a valid user session
router.use(function checkUserSession (req, res, next) {
    if (sessionManager.isValidSession(req.session)) {
        next();
    } else {
        res.redirect('/login');
    } 
});

router.get('/', (req, res) => {
    if (sessionManager.isValidSession(req.session)) {
        res.render('dashboard', {
            activeTab : 1,
            tabTitle: 'Dashboard - Qticket',
            mainTitle: 'Dashboard',
            subTitle: 'Orders',
            jsfiles: ['io-handler.js'],
            sessionData: req.session
        });
    } else {
        res.redirect('/login');
    }
});

router.get('/settings', (req, res) => {
    res.render('settings', {
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
        activeTab : 0,
        tabTitle: 'Not found error - TCSb',
        mainTitle: '',
        subTitle: '',
    });
});

module.exports = router;