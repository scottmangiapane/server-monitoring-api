const router = require('express').Router();
const auth = require('../controllers/auth');
const { verifySessionWithPassword, verifyPasswordWithMfa } = require('../controllers/verification');
const { check, validate } = require('../utils/validation');

router.post('/creds/email', [
    check('password', 'Your password must be at least 6 characters').isLength({ min: 6 }),
    check('newEmail', 'Your email address is invalid').isEmail().normalizeEmail()
], validate, verifySessionWithPassword, auth.postCredsEmail);

router.post('/creds/password', [
    check('password', 'Your password must be at least 6 characters').isLength({ min: 6 }),
    check('newPassword', 'Your password must be at least 6 characters').isLength({ min: 6 })
], validate, verifySessionWithPassword, auth.postCredsPassword);

router.post('/mfa/disable', [
    check('password', 'Your password must be at least 6 characters').isLength({ min: 6 })
], validate, verifySessionWithPassword, auth.postMfaDisable);

router.post('/mfa/enable', [
    check('password', 'Your password must be at least 6 characters').isLength({ min: 6 })
], validate, verifySessionWithPassword, auth.postMfaEnable);

router.post('/sign-in', [
    check('email', 'Your email address is invalid').isEmail().normalizeEmail(),
    check('password', 'Your password must be at least 6 characters').isLength({ min: 6 }),
    check('token', 'Your MFA token must be an integer').isInt().optional()
], validate, verifyPasswordWithMfa, auth.postSignIn);

router.post('/sign-out', auth.postSignOut);

module.exports = router;