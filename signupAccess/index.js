const express = require('express');
const SignUpAccess = require('./signUpAccess');
const path = require('path');
const url = require('url');
const helper = require('../helpers/common');

const router = express.Router();

router.get('/new', (req, res) => {
	res.render('newSignUpAccess');
});

router.post('/', (req, res) => {
	const email = req.body.email;
	if (email) {
		const doc = new SignUpAccess();
		const token = helper.randomUrlSafeToken(32);
		doc.token = token;
		doc.save()
			.then((savedDoc) => {
				req.flash('success', 'Sign up invitation email sent.');
				const signUpUrl = new url.URL(path.join(req.get('host'), 'users/new'));
				signUpUrl.searchParams.set('token', token);
				signUpUrl.searchParams.set('tokenId', savedDoc._id);
				if (process.env.NODE_ENV === 'development') {
					req.flash('success', signUpUrl);
				}
				res.redirect('back');
			})
			.catch((err) => {
				console.log(err);
				req.flash('danger', 'The request failed!');
				res.redirect('back');
			});
	}
});

module.exports = router;
