const express = require('express');
const User = require('../user/user');
const bcrypt = require('bcrypt');
const authHelper = require('../helpers/authorization');
const asyncMw = require('../helpers/async-middleware');

const router = express.Router();

router.get('/new', authHelper.redirectIfSignedIn, (req, res) => {
	res.render('sessions/new');
});

router.post('/', authHelper.redirectIfSignedIn, asyncMw(async (req, res) => {
	if (req.body.username && req.body.password) {
		const username = req.body.username.trim();
		const password = req.body.password;
		const user = await User.findOne({ username });
		if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
			req.flash('danger', 'Username or password is incorrect.');
			res.redirect('back');
			return;
		}
		authHelper.signIn(user, req);
		if (req.body.remember) {
			await authHelper.remember(user, res);
		}
		req.flash('success', 'signed in!');
		if (req.session.intendedPath) {
			const target = req.session.intendedPath;
			req.session.intendedPath = undefined;
			res.redirect(target);
			return;
		}
		res.redirect(req.app.locals.paths.home());
	} else {
		req.flash('danger', 'Both fields are required!');
		res.redirect('back');
	}
}));

router.delete('/', authHelper.mustBeSignedIn, asyncMw(async (req, res) => {
	await authHelper.signOut(req, res);
	res.status(200).end(req.app.locals.paths.signIn());
}));

module.exports = router;
