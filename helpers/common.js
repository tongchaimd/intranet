const urlSafeBase64 = require('urlsafe-base64');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

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

exports.pathsMiddleware = (req, res, next) => {
	res.locals.paths = req.app.locals.paths;
	next();
};
