const urlSafeBase64 = require('urlsafe-base64');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

exports.randomUrlSafeToken = (length) => {
	const buf = crypto.randomFillSync(Buffer.alloc(length));
	return urlSafeBase64.encode(buf);
};

exports.bcryptHash = function bcryptHash(value) {
	return bcrypt.hashSync(value, +process.env.SALT_ROUNDS);
};
