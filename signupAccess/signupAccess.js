var mongoose = require('mongoose');
var moment = require('moment');
var config = require('config');
var helper = require('../helpers/common');
var bcrypt = require('bcrypt');

var securityConfig = config.get('security');

var signupAccessSchema = new mongoose.Schema({
	tokenHash: {
		type: String,
		required: true
	},
	expiryDate: {
		type: Date,
		required: true
	}
});

signupAccessSchema.pre('validate', function() {
	this.expiryDate = moment().add(securityConfig.signupAccessLifeSpanDays, 'days').toDate();
});

signupAccessSchema.virtual('token')
	.get(function() {
		return this._token;
	})
	.set(function(value) {
		this._token = value;
		this.tokenHash = helper.bcryptHash(value);
	});

var SignupAccess = mongoose.model('SignupAccess', signupAccessSchema);

SignupAccess.validateToken = function(token, id) {
	return this.findById(id)
					.then((access) => {
						if(!access) {
							return false;
						}
						else if(access.expiryDate < moment()) {
							return false;
						}
						else if(!bcrypt.compare(token, access.tokenHash)) {
							return false;
						}
						else {
							return access;
						}
					});
};

module.exports = SignupAccess;