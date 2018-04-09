const express = require('express');
const BusinessCard = require('./business-card');
const upload = (require('multer'))();
const moment = require('moment');
const detectlanguage = require('../helpers/detectlanguage-promise');
const plist = require('plist');
const asyncMw = require('../helpers/async-middleware');

const router = express.Router();

router.get('/', (req, res) => {
	res.render('business-cards/import');
});

router.post('/', upload.single('file'), asyncMw(async (req, res) => {
	const content = req.file.buffer.toString();
	let parsed = plist.parse(content).kWCXF_R_CardArray;

	// filter duplicates
	for(let i = 0; i < parsed.length; i += 1) {
		if (await BusinessCard.findOne().where('wcId').equals(parsed[i]['kWCXF_CDL1_UniqueID'])) {
			delete parsed[i];
		}
	}
	parsed = parsed.filter(v => v);

	if (!parsed.length) {
		req.flash('warning', 'no new cards');
		res.redirect(req.app.locals.paths.businessCardsImport());
		return;
	}

	parsed.forEach((card) => {
		// remove prefix
		removeWcPrefix(card);

		// collapse keys
		const keysNeedCollapsing = [
			'Image',
			'Name',
			'Company',
			'Phone',
			'Address',
			'Email',
			'URL',
		];
		keysNeedCollapsing.forEach((key) => {
			collapseKey(card, key);
		});

		// filter and rename
		const allowedKeyMap = {
			'Image_Front': 'imageFront',
			'Image_Back': 'imageBack',
			'Name_Full': 'fullName',
			'Position': 'position',
			'Company_Name': 'companyName',
			'Phone_Work': 'phone',
			'Phone_Mobile': 'mobile',
			'Phone_WorkFax': 'fax',
			'Address_Work': 'companyLocation',
			'Email_Work': 'email',
			'URL_Work': 'website',
			'UniqueID': 'wcId',
		};
		Object.keys(card)
			.filter(key => !Object.keys(allowedKeyMap).includes(key))
			.forEach((key) => {
				delete card[key];
			});
		Object.keys(card)
			.forEach((key) => {
				card[allowedKeyMap[key]] = card[key];
				delete card[key];
			});

		// make sure values of these are arrays
		const keysNeedArrayify = [
			'fullName',
			'position',
			'companyName',
			'phone',
			'mobile',
			'fax',
			'companyLocation',
			'email',
			'website',
		];
		Object.keys(card)
			.filter(key => keysNeedArrayify.includes(key))
			.forEach((key) => {
				if (!Array.isArray(card[key])) {
					card[key] = [card[key]];
				}
			});

		// reduce address(es)
		if (card.companyLocation) {
			card.companyLocation = card.companyLocation.map((obj) => {
				const list = [];
				list.push(obj['Address_Street']);
				list.push(obj['Address_City'])
				list.push(obj['Address_State']);
				list.push(obj['Address_ZIP']);
				list.push(obj['Adress_Country']);
				return list.filter(v => v).join(', ');
			});
		}

	});

	// detect and arrange multi-language fields
	const multiLangValues = [];
	parsed.forEach((card) => {
		Object.keys(card)
			.filter(key => BusinessCard.isMultiLang(key))
			.forEach((key) => {
				multiLangValues.push(...card[key])
			});
	});
	const langCodeList = (await detectlanguage.detectPm(multiLangValues)).map(result => result[0] && result[0].language);
	parsed.forEach((card) => {
		Object.keys(card)
			.filter(key => BusinessCard.isMultiLang(key))
			.forEach((key) => {
				const valueList = card[key];
				card[key] = { english: [], chinese: [], thai: [] };
				valueList.forEach((value) => {
					const langCode = langCodeList.shift();
					switch (langCode) {
						case 'ja':
						case 'zh':
						case 'zh-Hant':
							card[key].chinese.push(value);
							break;
						case 'th':
							card[key].thai.push(value);
							break;
						default:
							card[key].english.push(value);
					}
				});
			});
	});

	parsed.forEach((card) => {
		Object.keys(card).forEach((key) => {
			if (Array.isArray(card[key])) {
				card[key] = card[key].filter(v => v).join(', ');
			}
			if (BusinessCard.isMultiLang(key)) {
				Object.keys(card[key]).forEach((lang) => {
					card[key][lang] = card[key][lang].filter(v => v).join(', ');
				});
			}
		});
	});

	await BusinessCard.insertMany(parsed);
	res.redirect(req.app.locals.paths.businessCards());
}));

function removeWcPrefix(arg) {
	if (typeof arg !== 'object') {
		return;
	}

	if (Array.isArray(arg)) {
		arg.forEach((item) => {
			removeWcPrefix(item);
		});
		return;
	}

	const obj = arg;
	const regex = /kWCXF_.+?_(.+)/

	Object.keys(obj).forEach((key) => {
		const matches = key.match(regex);
		if (matches) {
			obj[matches[1]] = obj[key];
			delete obj[key];
			removeWcPrefix(obj[matches[1]])
		} else {
			removeWcPrefix(obj[key]);
		}
	});
}

function collapseKey(obj, key) {
	if (!Object.keys(obj).includes(key)) {
		return;
	}

	if (typeof obj[key] === 'undefined' || obj[key] === null) {
		delete obj[key]
		return;
	}

	if (typeof obj[key] !== 'object') {
		return;
	}

	if (Array.isArray(obj[key])) {
		if (obj[key].some(i => typeof i !== 'object' || Array.isArray(i))) {
			return;
		}
		obj[key].forEach((subObj) => {
			Object.keys(subObj).forEach((subKey) => {
				if (!obj[subKey]) obj[subKey] = [];
				obj[subKey].push(subObj[subKey]);
			});
		});
	} else {
		Object.keys(obj[key]).forEach((subKey) => {
			obj[subKey] = obj[key][subKey];
		});
	}
	delete obj[key];
}

module.exports = router;
