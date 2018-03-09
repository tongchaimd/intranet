const express = require('express');
const User = require('./user');
const SignUpAccess = require('../signUpAccess/signUpAccess');
const authHelper = require('../helpers/authorization');

const router = express.Router();

router.get('/new', authHelper.redirectIfSignedIn, (req, res) => {
	const { token, tokenId } = req.query;
	SignUpAccess.validateToken(token, tokenId)
		.then((access) => {
			if (access) res.render('signUp', { title: 'SignUp', token, tokenId });
			else res.render('invalidToken');
		})
		.catch((err) => {
			console.log(err);
		});
});

/**
 * @todo consider about using 'this' keyword
 */
router.post('/', authHelper.redirectIfSignedIn, (req, res) => {
	const input = req.body;
	const user = new User({
		username: input.username,
		password: input.password,
		passwordConfirmation: input.passwordConfirmation,
	});
	SignUpAccess.validateToken(input.token, input.tokenId)
		.then((access) => {
			if (access) {
				this.access = access;
				return user.save();
			}
			return Promise.reject(new Error('token invalid'));
		})
		.then(() => {
			this.access.remove();
			return res.redirect(req.app.locals.paths.home);
		})
		.catch((err) => {
			// if it's not a validation error
			if (!err.errors) {
				console.log(err);
				res.render('sumtingwong');
			} else {
				Object.values(err.errors).forEach((validationError) => {
					req.flash('danger', validationError.message);
				});
				res.redirect('back');
			}
		});
});

router.get('/:id', authHelper.mustBeSignedIn, (req, res) => {
	User.findById(req.params.id)
		.then((user) => {
			if (user) {
				res.render('user', { u: user });
			}
		})
		.catch((err) => {
			console.log(err);
		});
});

router.get('/edit/:id', authHelper.mustBeSignedIn, (req, res) => {
	if (req.params.id !== req.currentUser._id.toString()) {
		req.flash('danger', 'not authorized!');
		res.redirect('back');
		return;
	}
	User.findById(req.params.id)
		.then((user) => {
			if (user) {
				res.render('userEdit', { u: user });
			}
		})
		.catch((err) => {
			console.log(err);
		});
});

router.patch('/:id', authHelper.mustBeSignedIn, (req, res) => {
	if (req.params.id !== req.currentUser._id.toString()) {
		req.flash('danger', 'not authorized!');
		res.redirect('back');
		return;
	}
	const input = req.body;
	let user;
	User.findById(req.params.id)
		.then((foundUser) => {
			user = foundUser;
			if (input.fullNameList) {
				if (typeof input.fullNameList === 'string') {
					input.fullNameList = [input.fullNameList];
				}
				user.fullNameList = input.fullNameList.filter(v => v.trim().length);
			}
			user.email = input.email;
			if (input.password) {
				user.password = input.password;
				user.passwordConfirmation = input.passwordConfirmation;
			}
			console.log();
			return user.save();
		})
		.then(() => {
			req.flash('success', 'updated!');
			res.redirect(req.app.locals.paths.user(user));
		})
		.catch((err) => {
			req.flash('danger', 'UPDATING FAILED!');
			if (err.errors) {
				Object.values(err.errors).forEach((validationError) => {
					req.flash('danger', validationError.message);
				});
				res.render('userEdit', { u: user });
			}
			console.log(err);
		});
});

module.exports = router;
