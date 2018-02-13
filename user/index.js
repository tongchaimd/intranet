var express = require('express');
var router = express.Router();
var User = require('./user');
var SignupAccess = require('../signupAccess/signupAccess');
var path = require('path');

router.get('/new', function(req, res) {
	var token = req.query.token;
	var tokenId = req.query.tokenId;
	SignupAccess.validateToken(token, tokenId)
		.then((access) => {
			if ( access ) {
				return res.render('signup', {title: 'Signup', token: token, tokenId: tokenId});
			}
			else {
				res.render('invalidToken');
			}
		})
		.catch((err) => {
			console.log(err);
		});
	// SignupAccess.findOne({token: token})
	// .then((access) => {
	// 	if(!access) return Promise.reject('no access');
	// 	if(access.expiryDate < moment()) return Promise.reject('expired');
	// 	res.render('signup', {title: 'Signup', token: req.query.token});
	// })
	// .catch((err) => {
	// 	console.log(err);
	// 	res.render('invalidToken');
	// });
});

router.post('/', function(req, res) {
	var input = req.body;
	var user = new User({
		email: input.email,
		username: input.username,
		password: input.password,
		passwordConfirmation: input.passwordConfirmation
	});
	SignupAccess.validateToken(input.token, input.tokenId)
		.then((access) => {
			if(access) {
				this.access = access;
				return user.save();
			} else {
				return Promise.reject(new Error('token invalid'));
			}
		})
		.then((user) => {
			this.access.remove();
			return res.end(user.toString());
		})
		.catch((err) => {
			// if it's not a validation error
			if(!err.errors) {
				console.log(err);
				res.render('sumtingwong');
			}
			else {
				for(var errPath in err.errors) {
					req.flash('danger', err.errors[errPath].message);
				}
				var signupPath = path.join(req.baseUrl, 'new');
				res.redirect(`${signupPath}/?token=${input.token}&tokenId=${input.tokenId}`);
			}
		});
});

router.get('/:id', function(req, res) {
	User.findById(req.params.id)
		.then((user) => {
			if(user) {
				return res.render('user', {u: user});
			}
		})
		.catch((err) => {
			console.log(err);
		});
});

module.exports = router;
