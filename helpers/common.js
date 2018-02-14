const config = require('config');
const urlSafeBase64 = require('urlsafe-base64');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../user/user');

const appConfig = config.get('app');
const securityConfig = config.get('security');

exports.buildTitle = function buildTitle(s) {
	if (s && s.trim().length) {
		return `${s.trim()} | ${appConfig.title}`;
	}
	return appConfig.title;
};

exports.titleMiddleware = function titleMiddleware(req, res, next) {
	res.locals.buildTitle = exports.buildTitle;
	next();
};

exports.randomUrlSafeToken = (length) => {
	const buf = crypto.randomFillSync(Buffer.alloc(length));
	return urlSafeBase64.encode(buf);
};

exports.bcryptHash = function bcryptHash(value) {
	return bcrypt.hashSync(value, securityConfig.saltRounds);
};

exports.currentUserMiddleware = function currentUserMiddleware(req, res, next) {
	if (req.session && req.session.userId) {
		User.findById(req.session.userId)
			.then((user) => {
				req.currentUser = user;
				next();
			})
			.catch((err) => {
				console.log(err);
			});
	} else {
		next();
	}
};
