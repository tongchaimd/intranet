const moment = require('moment');
const bcrypt = require('bcrypt');
const User = require('../user/user');
const commonHelper = require('../helpers/common');

async function currentUser(req) {
	if (req.session && req.session.userId) {
		return User.findById(req.session.userId);
	} else if (req.signedCookies.userId && req.cookies.rememberToken) {
		const user = await User.findById(req.signedCookies.userId);

		if (!user.rememberExpiryDate) return null;
		if (user.rememberExpiryDate < moment()) return null;
		if (!user.rememberHash) return null;
		if (!await bcrypt.compare(req.cookies.rememberToken, user.rememberHash)) return null;
		signIn(user, req);
		return user;
	}
	return null;
}

exports.currentUserMiddleware = function currentUserMiddleware(req, res, next) {
	if (!req.currentUser) {
		currentUser(req)
			.then((user) => {
				req.isSignedIn = user;
				req.currentUser = user;
				res.locals.isSignedIn = user;
				next();
			})
			.catch((err) => {
				console.log(err);
			});
	}
};

exports.mustBeSignedIn = function mustBeSignedIn(req, res, next) {
	if (!req.isSignedIn) {
		req.session.intendedPath = req.originalUrl;
		res.redirect(req.app.locals.paths.signIn);
	} else {
		next();
	}
};

exports.redirectIfSignedIn = function redirectIfSignedIn(req, res, next) {
	if (req.isSignedIn) {
		res.redirect(req.app.locals.paths.home);
	} else {
		next();
	}
};

function signIn(user, req) {
	req.session.userId = user._id;
}
exports.signIn = signIn;

exports.remember = async function remember(user, res) {
	const rememberToken = commonHelper.randomUrlSafeToken(32);
	const rememberExpiryDate = moment().add(process.env.SIGN_IN_REMEMBER_LIFE_SPAN_DAYS, 'days').toDate();
	user.set({ rememberHash: commonHelper.bcryptHash(rememberToken) });
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
