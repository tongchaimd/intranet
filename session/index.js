const express = require('express');
const bcrypt = require('bcrypt');
const authHelper = require('../helpers/authorization');
const asyncMw = require('../helpers/async-middleware');

const router = express.Router();

router.get('/new', authHelper.redirectIfSignedIn, (req, res) => {
	res.render('sessions/new');
});

router.post('/', authHelper.redirectIfSignedIn, asyncMw(async (req, res) => {
	if (req.body.password) {
		const password = req.body.password;
		if (!(await bcrypt.compare(password, process.env.PASSWORD_HASH))) {
			req.flash('danger', 'Password is incorrect!');
			res.redirect('back');
			return;
		}
		authHelper.signIn(req);
		req.flash('success', 'Signed in!');
		if (req.session.intendedPath) {
			const target = req.session.intendedPath;
			req.session.intendedPath = undefined;
			res.redirect(target);
			return;
		}
		res.redirect(req.app.locals.paths.home());
	} else {
		req.flash('danger', 'Password is required!');
		res.redirect('back');
	}
}));

router.delete('/', authHelper.mustBeSignedIn, asyncMw(async (req, res) => {
	authHelper.signOut(req);
	res.status(200).end(req.app.locals.paths.signIn());
}));

module.exports = router;
