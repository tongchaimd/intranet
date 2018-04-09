const express = require('express');
const User = require('./user');
const SignUpAccess = require('../sign-up-access/sign-up-access');
const authHelper = require('../helpers/authorization');
const asyncMw = require('../helpers/async-middleware');

const router = express.Router();

router.get('/', authHelper.mustBeSignedIn, asyncMw(async (req, res) => {
	const userList = await User.find().select('fullNameList email');
	res.render('users/index', {
		userList,
	});
}));

router.get('/new', authHelper.redirectIfSignedIn, asyncMw(async (req, res) => {
	const { token, tokenId } = req.query;
	const access = await SignUpAccess.validateToken(token, tokenId);
	if (access) {
		res.render('users/new', { token, tokenId });
		return;
	}
	res.render('errors/invalid-token');
}));

router.post('/', authHelper.redirectIfSignedIn, asyncMw(async (req, res) => {
	const input = req.body;
	const user = new User({
		username: input.username,
		password: input.password,
		passwordConfirmation: input.passwordConfirmation,
	});
	const access = await SignUpAccess.validateToken(input.token, input.tokenId);
	if (!access) throw new Error('token invalid');
	if (access.admin) {
		user.admin = true;
	}
	const error = user.validateSync();
	if (error) {
		Object.values(error.errors).forEach((validationError) => {
			req.flash('danger', validationError.message);
		});
		res.redirect('back');
		return;
	}
	await user.save();
	access.remove();
	res.redirect(req.app.locals.paths.signIn());
}));

router.get('/:id', authHelper.mustBeSignedIn, asyncMw(async (req, res, next) => {
	const user = await User.findById(req.params.id);
	if (!user) {
		next();
		return;
	}
	res.render('users/show', { user });
}));

router.get('/edit/:id', authHelper.mustBeSignedIn, asyncMw(async (req, res) => {
	if (req.params.id !== req.currentUser._id.toString()) {
		req.flash('danger', 'not authorized!');
		res.redirect('back');
		return;
	}
	const user = await User.findById(req.params.id);
	if (!user) {
		next();
		return;
	}
	res.render('users/edit', { user });
}));

router.patch('/:id', authHelper.mustBeSignedIn, asyncMw(async (req, res) => {
	if (req.params.id !== req.currentUser._id.toString()) {
		req.flash('danger', 'not authorized!');
		res.redirect('back');
		return;
	}
	const input = req.body;
	const user = await User.findById(req.params.id);
	if (input.fullNameList) {
		if (typeof input.fullNameList === 'string') {
			input.fullNameList = [input.fullNameList];
		}
		user.fullNameList = input.fullNameList.filter(v => v.trim().length);
	}
	user.email = input.email;
	user.info = input.info;
	if (input.password) {
		user.password = input.password;
		user.passwordConfirmation = input.passwordConfirmation;
	}
	const error = user.validateSync();
	if (error) {
		Object.values(error.errors).forEach((validationError) => {
			req.flash('danger', validationError.message);
		});
		res.render('users/edit', { user });
		return;
	}
	await user.save();
	req.flash('success', 'updated!');
	res.redirect(req.app.locals.paths.users(user));
}));

module.exports = router;
