const urlSafeBase64 = require('urlsafe-base64');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../user/user');

/** build title in the template of `{pagename} | {appname}` */
exports.buildTitle = function buildTitle(pageName) {
	if (pageName && pageName.trim().length) {
		return `${pageName.trim()} | ${process.env.TITLE}`;
	}
	// no pageName
	return process.env.TITLE;
};

/** expose buildTitle to Views */
exports.titleMiddleware = function titleMiddleware(req, res, next) {
	res.locals.buildTitle = exports.buildTitle;
	next();
};

exports.randomUrlSafeToken = (length) => {
	const buf = crypto.randomFillSync(Buffer.alloc(length));
	return urlSafeBase64.encode(buf);
};

exports.bcryptHash = function bcryptHash(value) {
	return bcrypt.hashSync(value, +process.env.SALT_ROUNDS);
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
