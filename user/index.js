const express = require('express');
const User = require('./user');
const SignUpAccess = require('../sign-up-access/sign-up-access');
const authHelper = require('../helpers/authorization');

const router = express.Router();

router.get('/', authHelper.mustBeSignedIn, (req, res) => {
	User.find()
		.select('fullNameList email')
		.then((userList) => {
			res.render('users/index', {
				userList,
			});
		})
		.catch((err) => {
			console.log(err);
		});
});

router.get('/new', authHelper.redirectIfSignedIn, (req, res) => {
	const { token, tokenId } = req.query;
	SignUpAccess.validateToken(token, tokenId)
		.then((access) => {
			if (access) res.render('users/new', { token, tokenId });
			else res.render('errors/invalid-token');
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
				if (access.admin) {
					user.admin = true;
				}
				return user.save();
			}
			return Promise.reject(new Error('token invalid'));
		})
		.then(() => {
			this.access.remove();
			return res.redirect(req.app.locals.paths.signIn());
		})
		.catch((err) => {
			// if it's not a validation error
			if (!err.errors) {
				console.log(err);
				res.render('errors/sumtingwong');
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
				res.render('users/show', { u: user });
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
				res.render('users/edit', { u: user });
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
			res.redirect(req.app.locals.paths.users(user));
		})
		.catch((err) => {
			req.flash('danger', 'UPDATING FAILED!');
			if (err.errors) {
				Object.values(err.errors).forEach((validationError) => {
					req.flash('danger', validationError.message);
				});
				res.render('users/edit', { u: user });
			}
			console.log(err);
		});
});

module.exports = router;
