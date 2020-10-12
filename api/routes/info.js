const router = require('express').Router();
const info = require('../controllers/info');
const { verifySession } = require('../controllers/verification');

router.get('/dynamic', verifySession, info.getDynamic);

router.get('/static', verifySession, info.getStatic);

module.exports = router;