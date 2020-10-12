const Account = require('../models/account');
const RateLimiter = require('../utils/rate-limiter');

const { blocker, punisher } = new RateLimiter({
    prefix: 'rl_auth',
    maxTokens: 24,
    seconds: 60 * 60 * 24
});

const _verifyPassword = (req, res, next) => {
    return blocker(req, res, async () => {
        // TODO remove this conditional to prevent edge cases where user provides mismatched session and req.body
        const account = (req.session.accountId)
            ? await new Account({ id: req.session.accountId }).fetch()
            : await new Account({ email: req.body.email }).fetch();
        if (!account) {
            return res.status(404).json({ errors: [{ msg: 'Account not found' }] });
        }
        if (!await account.comparePassword(req.body.password)) {
            return punisher(req, res, () => {
                return res.status(401).json({ errors: [{ msg: 'Incorrect password' }] });
            });
        }
        return next();
    });
};

const _verifyMfa = (req, res, next) => {
    return blocker(req, res, async () => {
        // TODO remove this conditional to prevent edge cases where user provides mismatched session and req.body
        const account = (req.session.accountId)
            ? await new Account({ id: req.session.accountId }).fetch()
            : await new Account({ email: req.body.email }).fetch();
        if (req.body.token) {
            if (!account.compareToken(req.body.token)) {
                return punisher(req, res, () => {
                    return res.status(401).json({ errors: [{ msg: 'Incorrect MFA token' }] });
                });
            }
            if (!account.get('mfa_verified')) {
                account.set('mfa_verified', true);
                await account.save();
            }
        } else if (account.get('mfa_verified')) {
            return res.status(401).json({ errors: [{ msg: 'MFA token is required' }] });
        }
        return next();
    });
};

const verifySession = async (req, res, next) => {
    const id = req.session.accountId;
    if (!id) {
        return res.status(401).json({ errors: [{ msg: 'Account not signed in' }] });
    }
    if (!await new Account({ id }).fetch()) {
        return res.status(404).json({ errors: [{ msg: 'Account not found' }] });
    }
    return next();
};

const verifySessionWithPassword = (req, res, next) => {
    verifySession(req, res, () => {
        _verifyPassword(req, res, next);
    });
}

const verifyPasswordWithMfa = (req, res, next) => {
    _verifyPassword(req, res, () => {
        _verifyMfa(req, res, next);
    });
};

module.exports = {
    verifySession,
    verifySessionWithPassword,
    verifyPasswordWithMfa
};