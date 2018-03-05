const express = require('express');
const User = require('../user/user');
const bcrypt = require('bcrypt');
const authHelper = require('../helpers/authorization');

const router = express.Router();

router.get('/new', authHelper.redirectIfSignedIn, (req, res) => {
	res.render('signin');
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
				if (good) {
					req.session.userId = user._id;
					req.flash('success', 'logged in!');
					return res.redirect(req.app.locals.homePath);
				}
				return Promise.reject(new Error('incorrect password'));
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
	req.session.userId = null;
	res.status(200).end(req.app.locals.signInPath);
});

module.exports = router;
