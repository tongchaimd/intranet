const express = require('express');
const BusinessCard = require('./business-card')
const asyncMw = require('../helpers/async-middleware');

const router = express.Router();

router.post('/', asyncMw(async (req, res) => {
	if (!req.session.basket) {
		req.session.basket = [];
	}

	if (!req.body.all) {
		req.session.basket = [...req.session.basket, ...req.body.idList]
	} else {
		req.session.bc = req.session.bc || {};
		let tagQuery = {};
		const filter = req.session.bc.filter;
		if (filter) {
			const toCondition = tag => ({ tagList: tag });
			const groups = [];

			if (filter.or) {
				groups.push(...filter.or
					.map(group => ({ $or: group.map(toCondition) })));
			}
			if (filter.single) {
				groups.push(...filter.single.map(toCondition));
			}

			if (groups.length) {
				tagQuery = { $and: groups };
			}
		}

		const result = await BusinessCard.find(tagQuery);
		req.session.basket = [...req.session.basket, ...result.map(c => c._id)];
	}
	res.redirect(req.app.locals.paths.businessCards());
}));

router.get('/', asyncMw(async (req, res) => {
	const config = req.session.basketConfig || {};
	const cardList = await BusinessCard.find()
		.where('_id')
		.in(req.session.basket || []);
	res.render('business-cards/basket', {
		cardList,
		languageList: BusinessCard.languageList(),
		prefLangList: config.prefLangList || [],
		fill: config.fill,
	});
}));

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

router.get('/table', asyncMw(async (req, res) => {
	const config = req.session.basketConfig || {};
	const cardList = await BusinessCard.find()
		.where('_id')
		.in(req.session.basket || []);
	res.render('business-cards/partials/basket-table', {
		cardList,
		languageList: BusinessCard.languageList(),
		prefLangList: config.prefLangList || [],
		fill: config.fill,
	});
}));

router.delete('/', (req, res) => {
	if (!req.session.basket) {
		res.redirect('back');
		return;
	}
	req.session.basket = req.session.basket.filter(id => !req.body.idList.includes(id));
	res.status(200).end()
})

module.exports = router;
