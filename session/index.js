var express = require('express');
var router = express.Router();
var path = require('path');
var User = require('../user/user');
var bcrypt = require('bcrypt');

router.get('/new', (req, res) => {
	res.render('signin');
});

router.post('/', function(req, res) {
	if(req.body.username && req.body.password) {
		var username = req.body.username.trim();
		var password = req.body.password;
		var user;
		User.findOne({username: username})
		.then((user) => {
			if(!user) {
				return Promise.reject(new Error('user not found'));
			} else {
				this.user = user;
				return bcrypt.compare(password, user.passwordHash);
			}
		})
		.then((good) => {
			if(good) {
				req.session.userId = this.user._id;
				req.flash('success', "logged in!");
				res.redirect(path.join(req.baseUrl, 'new'));
			} else {
				return Promise.reject(new Error('incorrect password'));
			}
		})
		.catch((err) => {
			console.log(err);
			req.flash('danger', 'Username or password is incorrect.');
			res.redirect(path.join(req.baseUrl, 'new'));
		});
	} else {
		req.flash('danger', "Both fields are required!");
		res.redirect(path.join(req.baseUrl, 'new'));
	}
});

module.exports = router;