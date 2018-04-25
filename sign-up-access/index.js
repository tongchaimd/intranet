const express = require('express');
const SignUpAccess = require('./sign-up-access');
const path = require('path');
const url = require('url');
const cryptoHelper = require('../helpers/crypto');
const moment = require('moment');
const bcrypt = require('bcrypt');
const asyncMw = require('../helpers/async-middleware');

const router = express.Router();

router.get('/new', (req, res) => {
	res.render('sign-up-access/new');
});

router.post('/', asyncMw(async (req, res) => {
	const email = req.body.email;
	const isAdmin = !!req.body.admin;
	const password = req.body.password;
	if (email) {
		const doc = new SignUpAccess();
		const token = cryptoHelper.randomUrlSafeToken(32);
		doc.token = token;
		if (isAdmin) {
			if (!password || !bcrypt.compareSync(password, req.currentUser.passwordHash)) {
				if (process.env.NODE_ENV !== 'development') {
					req.flash('danger', 'wrong password');
					res.redirect(req.app.locals.paths.invite());
					return;
				}
			}
			doc.admin = true;
		}
		const savedDoc = await doc.save();
		const signUpUrl = new url.URL(`${req.protocol}://${path.join(req.get('host'), req.app.locals.paths.signUp())}`);
		signUpUrl.searchParams.set('token', token);
		signUpUrl.searchParams.set('tokenId', savedDoc._id);
		const msg = {
			to: email,
			from: `noreply@${req.host}`,
			subject: 'Intranet sign up invitation.',
			text: `This email contains a link to creating only 1 account on the intranet. The link will be expired ${moment(doc.expiryDate).fromNow()}.\nThe link: ${signUpUrl}`,
		};
		if (process.env.NODE_ENV === 'development') {
			req.flash('success', signUpUrl);
		}
		await req.app.locals.sgMail.send(msg);
		req.flash('success', 'Sign up invitation email sent.');
		res.redirect('back');
	}
}));

module.exports = router;
