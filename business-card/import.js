const express = require('express');
const BusinessCard = require('./business-card');
const upload = (require('multer'))();
const parse = require('csv-parse/lib/sync');
const moment = require('moment');
const detectlanguage = require('../helpers/detectlanguage-promise');

const router = express.Router();

router.get('/', (req, res) => {
	res.render('business-cards/import');
});

router.post('/', upload.single('file'), async (req, res) => {
	try {
		const content = req.file.buffer.toString();
		let parsed = parse(content, { columns: true });
		// parse time
		parsed.forEach((card) => {
			// moment parses string better than Date
			card['Created Time'] = moment(card['Created Time']).toDate();
		});

		// filter duplicates
		for (let i = 0; i < parsed.length; i += 1) {
			if (await BusinessCard.findOne({ wcCreatedTime: parsed[i]['Created Time'] })) {
				delete parsed[i];
			}
		}
		parsed = parsed.filter(v => v);
		if (!parsed.length) {
			req.flash('warning', 'no new cards');
			res.redirect(req.app.locals.paths.businessCardsImport())
			return;
		}

		parsed.forEach((card) => {
			// collapse array fields
			const arrayFieldKey = /^([\w ]+)\d+$/;
			Object.keys(card).forEach((key) => {
				const matches = key.match(arrayFieldKey);
				if (!matches) return;
				const keyName = matches[1];
				if (!card[keyName]) {
					card[keyName] = [];
				}
				if (typeof card[keyName] === 'string') {
					card[keyName] = [card[keyName]];
				}
				card[keyName].push(card[key]);
				delete card[key];
			});

		});

		const keyMap = {
			'Full Name': 'fullName',
			'Company': 'companyName',
			'Office TEL': 'phone',
			'Office Email': 'email',
			'Job Title': 'position',
			'Office Address': 'companyLocation',
			'Office FAX': 'fax',
			'Mobile TEL': 'mobile',
			'Office Website': 'website',
			'Created Time': 'wcCreatedTime',
		};
		parsed = parsed.map((oldCard) => {
			const newCard = {};
			Object.keys(oldCard).forEach((oldKey) => {
				if (keyMap[oldKey]) {
					newCard[keyMap[oldKey]] = oldCard[oldKey];
				}
			});
			return newCard;
		});

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

		BusinessCard.insertMany(parsed)
			.then(() => {
				res.redirect(req.app.locals.paths.businessCards());
			})
			.catch((err) => {
				console.log(err);
			});
	} catch (err) {
		console.log(err);
	}
});

module.exports = router;
