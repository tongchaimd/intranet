const User = require('../user/user');

function currentUser(req) {
	if (req.session && req.session.userId) {
		return User.findById(req.session.userId)
			.then(user => user);
	}
	return Promise.resolve(null);
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
		res.redirect(req.app.locals.signInPath);
	} else {
		next();
	}
};

exports.redirectIfSignedIn = function redirectIfSignedIn(req, res, next) {
	if (req.isSignedIn) {
		res.redirect(req.app.locals.homePath);
	} else {
		next();
	}
};
