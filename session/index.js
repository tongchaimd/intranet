const express = require('express');
const path = require('path');
const User = require('../user/user');
const bcrypt = require('bcrypt');

const router = express.Router();

router.get('/new', (req, res) => {
	res.render('signin');
});

router.post('/', (req, res) => {
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
					req.session.userId = this.user._id;
					req.flash('success', 'logged in!');
					return res.redirect('back');
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

module.exports = router;
