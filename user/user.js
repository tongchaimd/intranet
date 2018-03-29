const mongoose = require('mongoose');
const helper = require('../helpers/common');

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

const uniqueValidator = function uniqueValidator(key) {
	return function (v, cb) {
		User.findOne({ [key]: v, _id: { $ne: this._id } }, (err, u) => {
			cb(!u, `${capitalize(key)} has already been taken!`);
		});
	};
};

// schema
const userSchema = new mongoose.Schema({
	username: {
		type: String,
		unique: true,
		required: [true, 'Username is required!'],
		minlength: [4, 'Username must be 4-20 characters'],
		maxlength: [20, 'Username must be 4-20 characters'],
		trim: true,
		validate: {
			isAsync: true,
			validator: uniqueValidator('username'),
		},
	},
	passwordHash: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		trim: true,
	},
	fullNameList: {
		type: [String],
	},
	rememberHash: {
		type: String,
	},
	rememberExpiryDate: {
		type: Date,
	},
	admin: {
		type: Boolean,
	},
});

userSchema.virtual('isAdmin')
	.get(function getIsAdmin() {
		return this.admin;
	});

userSchema.virtual('password')
	.get(function getPassword() {
		return this._passwordValue;
	})
	.set(function setPassword(value) {
		this._password = value;
		this.passwordHash = helper.bcryptHash(value);
	});

userSchema.virtual('passwordConfirmation')
	.get(function getPasswordConfirmation() {
		return this._passwordConfirmation;
	})
	.set(function setPasswordConfirmation(value) {
		this._passwordConfirmation = value;
	});

userSchema.path('passwordHash').validate(function validatePasswordConfirmation() {
	if (this._password || this._passwordConfirmation) {
		if (this._password.length < 4) {
			this.invalidate('password', 'Password must be at least 4 characters long!');
		}
		if (this._password !== this._passwordConfirmation) {
			this.invalidate('passwordConfirmation', 'Password confirmation must be the same as password!');
		}
	} else if (this.isNew) {
		this.invalidate('password', 'Password is required!');
	}
});

userSchema.virtual('fullName')
	.get(function fullname() {
		if (!this.fullNameList.length) {
			return 'no name';
		}
		return this.fullNameList[0];
	});

const User = mongoose.model('User', userSchema);

module.exports = User;
