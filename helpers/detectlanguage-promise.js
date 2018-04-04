const constructor = require('detectlanguage');

const detectlanguage = new constructor({ key: process.env.DETECTLANGUAGE_API_KEY });

detectlanguage.detectPm = function detectPm(data) {
	return new Promise((resolve, reject) => {
		detectlanguage.detect(data, (err, result) => {
			if (err) {
				return reject(err);
			}
			return resolve(result);
		})
	});
}

module.exports = detectlanguage;
