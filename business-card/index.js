const express = require('express');
const BusinessCard = require('./business-card');

const router = express.Router();

router.get('/new', (req, res) => {
	res.render('business-cards/new');
});

router.post('/', (req, res) => {
	const input = {};
	// extract language specific fields
	Object.keys(req.body).forEach((key) => {
		if(req.body[key]) {
			const matches = key.match(/(.+)-(.+)/);
			if(matches) {
				const language = matches[1];
				const realKey = matches[2];
				if(!input[realKey]) {
					input[realKey] = {};
				}
				input[realKey][language] = req.body[key];
			} else {
				input[key] = req.body[key];
			}
		}
	});
	const businessCard = new BusinessCard(input);
	businessCard.save()
		.then((doc) => {
			req.flash('success', 'Business Card Saved');
			res.redirect(req.app.locals.paths.newBusinessCard());
		})
		.catch((err) => {
			console.log(err);
		});
});

module.exports = router;