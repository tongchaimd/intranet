var config = require('config');
var urlSafeBase64 = require('urlsafe-base64');
var crypto = require('crypto');
var url = require('url');
var bcrypt = require('bcrypt');
var User = require('../user/user');

var appConfig = config.get('app');
var securityConfig = config.get('security');

exports.buildTitle = function(s) {
	if(s && s.trim().length != 0) {
		return s.trim() + " | " + appConfig.title;
	} else {
		return appConfig.title;
	}
};

exports.titleMiddleware = function(req, res, next) {
	res.locals.buildTitle = exports.buildTitle;
	next();
};

exports.randomUrlSafeToken = (length) => {
	var buf = crypto.randomFillSync(Buffer.alloc(length));
	return urlSafeBase64.encode(buf);
};

exports.bcryptHash = function(value) {
	return bcrypt.hashSync(value, securityConfig.saltRounds);
};

exports.currentUserMiddleware = function(req, res, next) {
	if(req.session && req.session.userId) {
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