const express = require('express');
const User = require('../user/user');
const bcrypt = require('bcrypt');
const authHelper = require('../helpers/authorization');

const router = express.Router();

router.get('/new', authHelper.redirectIfSignedIn, (req, res) => {
	res.render('sessions/new');
});

router.post('/', authHelper.redirectIfSignedIn, (req, res) => {
	if (req.body.username && req.body.password) {
		const username = req.body.username.trim();
		const password = req.body.password;
		let user;
		User.findOne({ username })
			.then((doc) => {
				if (!doc) {
					return Promise.reject(new Error('user not found'));
				}
				user = doc;
				return bcrypt.compare(password, user.passwordHash);
			})
			.then((good) => {
				if (!good) {
					return Promise.reject(new Error('incorrect password'));
				}
				authHelper.signIn(user, req);
				if (req.body.remember) {
					return authHelper.remember(user, res);
				}
				return Promise.resolve();
			})
			.then(() => {
				req.flash('success', 'signed in!');
				if (req.session.intendedPath) {
					const target = req.session.intendedPath;
					req.session.intendedPath = undefined;
					return res.redirect(target);
				}
				return res.redirect(req.app.locals.paths.home);
			})
			.catch((err) => {
				console.log(err);
				req.flash('danger', 'Username or password is incorrect.');
				res.redirect('back');
			});
	} else {
		req.flash('danger', 'Both fields are required!');
		res.redirect('back');
	}
});

router.delete('/', authHelper.mustBeSignedIn, (req, res) => {
	authHelper.signOut(req, res)
		.then(() => {
			res.status(200).end(req.app.locals.paths.signIn);
		})
		.catch((err) => {
			console.log(err);
		});
});

module.exports = router;
