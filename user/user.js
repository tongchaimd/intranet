var mongoose = require('mongoose');
var helper = require('../helpers/common');

String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

var uniqueValidator = function(key) {
	return function(v, cb) {
		User.findOne({ [key]: v }, function(err, u) {
			cb(!u, `${key.capitalize()} has already been taken!`);
		});
	};
};

// schema
var userSchema = new mongoose.Schema({
	username: {
		type: String,
		unique: true,
		required: [true, 'Username is required!'],
		minlength: [4, 'Username must be 4-20 characters'],
		maxlength: [20, 'Username must be 4-20 characters'],
		trim: true,
		validate: {
			isAsync: true,
			validator: uniqueValidator('username')
		}
	},
	passwordHash: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: [true, 'Email is required!'],
		unique: true,
		trim: true,
		validate: {
			isAsync: true,
			validator: uniqueValidator('email')
		}
	},
	fullName: {
		type: [String]
	}
});

userSchema.virtual('password')
	.get(function() {
		return this._password;
	})
	.set(function(value) {
		this._password = value;
		this.passwordHash = helper.bcryptHash(value);
	});

userSchema.virtual('passwordConfirmation')
	.get(function() {
		return this._passwordConfirmation;
	})
	.set(function(value) {
		this._passwordConfirmation = value;
	});

userSchema.path('passwordHash').validate(function() {
	if(this._password || this._passwordConfirmation) {

		if(this._password.length < 4) {
			this.invalidate('password', 'Password must be at least 4 characters long!');
		}
		if(this._password !== this.passwordConfirmation) {
			this.invalidate('passwordConfirmation', 'Password confirmation must be the same as password!');
		}

	} else {
		this.invalidate('password', 'Password is required!');
	}
});

var User = mongoose.model('User', userSchema);

User.authenticate = function(password) {

};

module.exports = User;
