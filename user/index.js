const express = require('express');
const User = require('./user');
const SignupAccess = require('../signupAccess/signupAccess');
const path = require('path');

const router = express.Router();

router.get('/new', (req, res) => {
	const { token, tokenId } = req.query;
	SignupAccess.validateToken(token, tokenId)
		.then((access) => {
			if (access) res.render('signup', { title: 'Signup', token, tokenId });
			else res.render('invalidToken');
		})
		.catch((err) => {
			console.log(err);
		});
});

/**
 * @todo consider about using 'this' keyword
 */
router.post('/', (req, res) => {
	const input = req.body;
	const user = new User({
		email: input.email,
		username: input.username,
		password: input.password,
		passwordConfirmation: input.passwordConfirmation,
	});
	SignupAccess.validateToken(input.token, input.tokenId)
		.then((access) => {
			if (access) {
				this.access = access;
				return user.save();
			}
			return Promise.reject(new Error('token invalid'));
		})
		.then((savedUser) => {
			this.access.remove();
			return res.end(savedUser.toString());
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
				const signupPath = path.join(req.baseUrl, 'new');
				res.redirect(`${signupPath}/?token=${input.token}&tokenId=${input.tokenId}`);
			}
		});
});

router.get('/:id', (req, res) => {
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

module.exports = router;
