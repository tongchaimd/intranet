const mongoose = require('mongoose');
const moment = require('moment');
const helper = require('../helpers/common');
const bcrypt = require('bcrypt');

const signUpAccessSchema = new mongoose.Schema({
	tokenHash: {
		type: String,
		required: true,
	},
	expiryDate: {
		type: Date,
		required: true,
	},
});

signUpAccessSchema.pre('validate', function setExpiryDate() {
	this.expiryDate = moment().add(process.env.SIGN_UP_ACCESS_LIFE_SPAN_DAYS, 'days').toDate();
});

signUpAccessSchema.virtual('token')
	.get(function getToken() {
		return this._token;
	})
	.set(function setToken(value) {
		this._token = value;
		this.tokenHash = helper.bcryptHash(value);
	});

const SignUpAccess = mongoose.model('SignUpAccess', signUpAccessSchema);

SignUpAccess.validateToken = function validateToken(token, id) {
	return this.findById(id)
		.then((access) => {
			if (!access) {
				return false;
			}
			if (access.expiryDate < moment()) {
				return false;
			}
			if (!bcrypt.compare(token, access.tokenHash)) {
				return false;
			}
			return access;
		});
};

module.exports = SignUpAccess;
