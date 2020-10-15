const Account = require('../models/account');

const _verifyAccountId = async (req, res, next) => {
    const id = req.params.accountId;
    if (id !== req.session.accountId) {
        return res.status(403).json({ errors: [{ msg: 'Unauthorized' }] });
    }
    if (!await new Account({ id }).fetch()) {
        return res.status(404).json({ errors: [{ msg: 'Account not found' }] });
    }
    return next();
};

const postIndex = async (req, res, next) => {
    if (process.env.ALLOW_SIGN_UP === 'false') {
        return res.status(403).json({ errors: [{ msg: 'Account creation is disabled' }] });
    }
    const { email, password } = req.body;
    if (await new Account({ email }).fetch()) {
        return res.status(409).json({ errors: [{ msg: 'Email is already in use' }] });
    }
    await new Account({ email, password }).save();
    return next();
};

const deleteAccountId = (req, res) => {
    _verifyAccountId(req, res, async () => {
        const id = req.params.accountId;
        await new Account({ id }).destroy();
        return res.status(204).json({});
    });
};

const getAccountId = (req, res) => {
    _verifyAccountId(req, res, async () => {
        const id = req.params.accountId;
        const account = await new Account({ id }).fetch();
        return res.json(account);
    });
};

module.exports = {
    postIndex,
    deleteAccountId,
    getAccountId
};