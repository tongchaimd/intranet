const moment = require('moment');
const bcrypt = require('bcrypt');
const User = require('../user/user');
const cryptoHelper = require('./crypto');
const asyncMw = require('./async-middleware');

async function currentUser(req) {
	if (req.session && req.session.userId) {
		return User.findById(req.session.userId);
	} else if (req.signedCookies.userId && req.cookies.rememberToken) {
		const user = await User.findById(req.signedCookies.userId);

		if (!user) return null;
		if (!user.rememberExpiryDate) return null;
		if (user.rememberExpiryDate < moment()) return null;
		if (!user.rememberHash) return null;
		if (!await bcrypt.compare(req.cookies.rememberToken, user.rememberHash)) return null;
		signIn(user, req);
		return user;
	}
	return null;
}

exports.currentUserMiddleware = asyncMw(async function currentUserMiddleware(req, res, next) {
	if (!req.currentUser) {
		const user = await currentUser(req)
		req.isSignedIn = user;
		req.currentUser = user;
		res.locals.isSignedIn = user;
		res.locals.currentUser = user;
		next();
	}
});

exports.mustBeSignedIn = function mustBeSignedIn(req, res, next) {
	if (!req.isSignedIn) {
		req.session.intendedPath = req.originalUrl;
		res.redirect(req.app.locals.paths.signIn());
	} else {
		next();
	}
};

exports.mustBeAdmin = function mustBeAdmin(req, res, next) {
	if (!req.isSignedIn) {
		req.session.intendedPath = req.originalUrl;
		res.redirect(req.app.locals.paths.signIn());
	} else if (!req.currentUser.isAdmin) {
		res.render('errors/unauthorized');
	} else {
		next();
	}
};

exports.redirectIfSignedIn = function redirectIfSignedIn(req, res, next) {
	if (req.isSignedIn) {
		res.redirect(req.app.locals.paths.home());
	} else {
		next();
	}
};

function signIn(user, req) {
	req.session.userId = user._id;
}
exports.signIn = signIn;

exports.remember = async function remember(user, res) {
	const rememberToken = cryptoHelper.randomUrlSafeToken(32);
	const rememberExpiryDate = moment().add(process.env.SIGN_IN_REMEMBER_LIFE_SPAN_DAYS, 'days').toDate();
	user.set({ rememberHash: cryptoHelper.bcryptHash(rememberToken) });
	user.set({ rememberExpiryDate });
	return user.save()
		.then(() => {
			res.cookie('userId', user._id, {
				expires: rememberExpiryDate,
				httpOnly: true,
				signed: true,
				sameSite: true,
			});
			res.cookie('rememberToken', rememberToken, {
				expires: rememberExpiryDate,
				httpOnly: true,
				sameSite: true,
			});
		});
};

exports.signOut = async function signOut(req, res) {
	// only remove user's remember if it's the client that user "remember me"'d on
	if (req.signedCookies.userId && req.signedCookies.userId === req.currentUser._id.toString()) {
		req.currentUser.rememberExpiryDate = undefined;
		req.currentUser.rememberHash = undefined;
		await req.currentUser.save();
	}
	// clear cookies no matter what
	res.cookie('userId', '', { expired: new Date() });
	res.cookie('rememberToken', '', { expired: new Date() });

	// clear session
	req.session.userId = null;
};
