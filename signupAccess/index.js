const express = require('express');
const SignupAccess = require('./signupAccess');
const path = require('path');
const url = require('url');
const helper = require('../helpers/common');

const router = express.Router();

router.get('/new', (req, res) => {
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

router.post('/', (req, res) => {
	const email = req.body.email;
	if (email) {
		const doc = new SignupAccess();
		const token = helper.randomUrlSafeToken(32);
		doc.token = token;
		doc.save()
			.then((savedDoc) => {
				req.flash('success', 'Signup invitation email sent.');
				const signupUrl = new url.URL(path.join(req.get('host'), 'users/new'));
				signupUrl.searchParams.set('token', token);
				signupUrl.searchParams.set('tokenId', savedDoc._id);
				if (process.env.NODE_ENV === 'development') {
					req.flash('success', signupUrl);
				}
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
