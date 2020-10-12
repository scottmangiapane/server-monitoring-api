const router = require('express').Router();
const accounts = require('../controllers/accounts');
const auth = require('../controllers/auth');
const { verifySession } = require('../controllers/verification');
const { check, param, validate } = require('../utils/validation');

router.post('/', [
    check('email', 'Your email address is invalid').isEmail().normalizeEmail(),
    check('password', 'Your password must be at least 6 characters').isLength({ min: 6 })
], validate, accounts.postIndex, auth.postSignIn);

router.delete('/:accountId', [
    param('accountId', 'Your account ID must be a UUID').isUUID()
], validate, verifySession, accounts.deleteAccountId);

router.get('/:accountId', [
    param('accountId', 'Your account ID must be a UUID').isUUID()
], validate, verifySession, accounts.getAccountId);

module.exports = router;