const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const bookshelf = require('../utils/bookshelf');

const Account = bookshelf.model('Account', {
    tableName: 'accounts',
    hasTimestamps: true,
    hidden: [ 'password', 'mfa_secret' ],
    requireFetch: false,

    initialize() {
        this.on('saving', (model) => {
            if (model.hasChanged('password')) {
                return new Promise ((resolve, reject) => {
                    const password = model.attributes.password;
                    bcrypt.hash(password, 12, (err, hash) => {
                        if (err) reject(err);
                        model.set('password', hash);
                        resolve(hash);
                    });
                });
            }
        }, this);
    },

    comparePassword(password) {
        return bcrypt.compare(password, this.get('password'));
    },

    compareToken(token) {
        const secret = this.get('mfa_secret');
        return speakeasy.totp.verify({
            algorithm: 'sha256',
            encoding: 'base32',
            secret,
            token
        });
    }
});

module.exports = Account;