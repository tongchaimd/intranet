function isSignedIn(req) {
	return ((req.session && req.session.isSignedIn) || !process.env.PASSWORD_HASH);
}

exports.isSignedInMiddleware = function isSignedInMiddleware(req, res, next) {
	const value = isSignedIn(req);
	req.isSignedIn = value;
	res.locals.isSignedIn = value;
	next();
}

exports.mustBeSignedIn = function mustBeSignedIn(req, res, next) {
	if (!req.isSignedIn) {
		req.session.intendedPath = req.originalUrl;
		res.redirect(req.app.locals.paths.signIn());
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

function signIn(req) {
	req.session.isSignedIn = true;
}
exports.signIn = signIn;

exports.signOut = function signOut(req, res) {
	req.session.isSignedIn = null;
};
