const 	express = require('express')
	 	router = express.Router(),
	 	sessMng = require(constants.modelsPath + 'SessionManager');

let sessionManager = new sessMng();

// middleware that is specific to this router
router.use(function checkUserSession (req, res, next) {

  	next();
})

router.get('/rest/getusers', (req, res) => {
    if (sessionManager.isValidSession(req)) {

    } else {

    }
});

router.post('/rest/deleteuser', (req, res) => {
    
});

//Page Routes
router.get('/', (req, res) => {
	console.log('=>test');
    if (sessionManager.isValidSession(req.session)) {
        res.render('dashboard', {
            activeTab : 1,
            tabTitle: 'Dashboard - Qticket',
            mainTitle: 'Dashboard',
            subTitle: 'Orders',
            jsfiles: ['io-handler.js']
        });
    } else {
        res.render('login', {
            layout: false,
        });        
    }
});

router.get('/settings', (req, res) => {
    res.render('settings', {
        activeTab : 2,
        tabTitle: 'Settings - TCSb',
        mainTitle: 'Settings',
        subTitle: '',
        jsfiles: ['bootstrap-modal.js','settings.js']
    });
});

// 404 default route
router.get('*', function(req, res){
    res.render('404', {
        activeTab : 0,
        tabTitle: 'Not found error - TCSb',
        mainTitle: '',
        subTitle: '',
    });
});

module.exports = router;