const router = require('express').Router();
const info = require('../controllers/info');

router.get('/dynamic', info.getDynamic);

router.get('/static', info.getStatic);

module.exports = router;