var express = require('express');
var router = express.Router();
var moment = require('moment');
var SignupAccess = require('./signupAccess');
var config = require('config');
var crypto = require('crypto');
var path = require('path');
var url = require('url');
var helper = require('../helpers/common');

var securityConfig = config.get('security');

router.get('/new', function(req, res) {
	res.render('newSignupAccess');
});

// function randomTokenUntilUnique(length) {
// 	var token = helper.randomUrlSafeToken(length);
// 	return SignupAccess.findOne({token: token})
// 					.then((u) => {
// 						if(u) return randomTokenUntilUnique(length);
// 						return token;
// 					});
// }

router.post('/', function(req, res) {
	var email = req.body.email;
	if(email) {
		var doc = new SignupAccess();
		var token = helper.randomUrlSafeToken(32);
		doc.token = token;
		doc.save()
		.then((doc) => {
			req.flash('success', 'Signup invitation email sent.');
			var signupUrl = new url.URL(path.join(req.get('host'), 'users/new'));
			signupUrl.searchParams.set('token', token);
			signupUrl.searchParams.set('tokenId', doc._id);
			req.flash('success', signupUrl);
			res.redirect(path.join(req.baseUrl, '/new'));
		})
		.catch((err) => {
			console.log(err);
			req.flash('danger', 'The request failed!');
			res.redirect(path.join(req.baseUrl, '/new'));
		});
	}
});

module.exports = router;