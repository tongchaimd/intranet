const express = require('express');
const BusinessCard = require('./business-card')

const router = express.Router();

router.post('/', (req, res) => {
	if (!req.session.basket) {
		req.session.basket = [];
	}
	req.session.basket = [...req.session.basket, ...req.body.idList]
	res.status(200).end()
});

router.get('/', (req, res) => {
	const config = req.session.basketConfig || {};
	console.log(config)
	BusinessCard.find()
		.where('_id')
		.in(req.session.basket || [])
		.then((cardList) => {
			res.render('business-cards/basket', {
				cardList,
				languageList: BusinessCard.languageList(),
				prefLangList: config.prefLangList || [],
				fill: config.fill,
			});
		})
		.catch((err) => {
			console.log(err)
		});
});

router.patch('/', (req, res) => {
	const input = req.body;
	if (!req.session.basketConfig) {
		req.session.basketConfig = {};
	}
	req.session.basketConfig.fill = !!input.fill;
	delete input.fill;
	req.session.basketConfig.prefLangList = Object.keys(input);
	res.redirect(req.app.locals.paths.businessCardsBasket());
})

router.get('/table', (req, res) => {
	const config = req.session.basketConfig || {};
	console.log(config)
	BusinessCard.find()
		.where('_id')
		.in(req.session.basket || [])
		.then((cardList) => {
			res.render('business-cards/partials/basket-table', {
				cardList,
				languageList: BusinessCard.languageList(),
				prefLangList: config.prefLangList || [],
				fill: config.fill,
			});
		})
		.catch((err) => {
			console.log(err)
		});
})

router.delete('/', (req, res) => {
	if (!req.session.basket) {
		res.redirect('back');
		return;
	}
	req.session.basket = req.session.basket.filter(id => !req.body.idList.includes(id));
	res.status(200).end()
})

module.exports = router;
