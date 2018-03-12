const express = require('express');
const SignUpAccess = require('./sign-up-access');
const path = require('path');
const url = require('url');
const helper = require('../helpers/common');

const router = express.Router();

router.get('/new', (req, res) => {
	res.render('sign-up-access/new');
});

router.post('/', (req, res) => {
	const email = req.body.email;
	if (email) {
		const doc = new SignUpAccess();
		const token = helper.randomUrlSafeToken(32);
		doc.token = token;
		doc.save()
			.then((savedDoc) => {
				const signUpUrl = new url.URL(`${req.protocol}://${path.join(req.get('host'), req.app.locals.paths.signUp())}`);
				signUpUrl.searchParams.set('token', token);
				signUpUrl.searchParams.set('tokenId', savedDoc._id);
				if (process.env.NODE_ENV === 'development') {
					req.flash('success', signUpUrl);
				}
				req.flash('success', 'Sign up invitation email sent.');
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
