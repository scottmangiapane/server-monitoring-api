const speakeasy = require('speakeasy');
const Account = require('../models/account');

const postCredsEmail = async (req, res) => {
    const id = req.session.accountId;
    const email = req.body.newEmail;
    await new Account({ id }).save({ email });
    return res.status(204).json({});
};

const postCredsPassword = async (req, res) => {
    const id = req.session.accountId;
    const password = req.body.newPassword;
    await new Account({ id }).save({ password });
    return res.status(204).json({});
};

const postMfaDisable = async (req, res) => {
    const id = req.session.accountId;
    await new Account({ id }).save({
        'mfa_secret': null,
        'mfa_verified': false
    });
    return res.status(204).json({});
}

const postMfaEnable = async (req, res) => {
    const secret = speakeasy.generateSecret().base32;
    const id = req.session.accountId;
    const account = await new Account({ id }).save({
        'mfa_secret': secret,
        'mfa_verified': false
    });
    const payload = {
        algorithm: 'sha256',
        encoding: 'base32',
        issuer: 'Server Monitoring',
        label: account.get('email'),
        secret: secret
    };
    payload.url = speakeasy.otpauthURL(payload);
    return res.json(payload);
};

const postSignIn = async (req, res) => {
    const email = req.body.email;
    const account = await new Account({ email }).fetch();
    const id = account.get('id');
    req.session.accountId = id;
    return res.json({ id });
};

const postSignOut = async (req, res) => {
    await req.session.destroy();
    return res.status(204).json({});
};

module.exports = {
    postCredsEmail,
    postCredsPassword,
    postMfaEnable,
    postMfaDisable,
    postSignIn,
    postSignOut
};