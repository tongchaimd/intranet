const express = require('express');
const BusinessCard = require('./business-card')

const router = express.Router();

router.post('/', (req, res) => {
	const input = req.body;
	const validKeys = [
		'preferLanguage',
		'removefilter',
		'orgroupfilter',
		'sort',
		'direction',
	];
	req.session.bc = req.session.bc || {};

	req.session.bc = { ...req.session.bc, ...input };

	res.status(200).redirect(req.app.locals.paths.businessCards());
});

router.post('/addfilter', (req, res) => {
	const input = req.body;
	req.session.bc = req.session.bc || {};
	req.session.bc.filter = req.session.bc.filter || {};
	const filter = req.session.bc.filter;
	filter.single = filter.single || [];

	filter.single.push(input.text);

	res.status(200).redirect(req.app.locals.paths.businessCards());
});

router.post('/removefilter', (req, res) => {
	const input = req.body;
	const bc = req.session.bc;
	if (!bc || !bc.filter || !bc.filter.single) {
		res.status(200).redirect(req.app.locals.paths.businessCards());
		return;
	}
	const filter = bc.filter;

	if (input.or) {
		const idx = input.index;
		const subidx = input.subindex;
		filter.or[idx].splice(subidx, 1);

		if (filter.or[idx].length === 1) {
			// move to single
			filter.single.push(filter.or.splice(idx, 1)[0]);
		}
	} else {
		const idx = input.index;
		filter.single.splice(idx, 1);
	}

	res.status(200).redirect(req.app.locals.paths.businessCards());
});

router.post('/formorgroup', (req, res) => {
	const input = req.body;
	if (Object.keys(input).length < 2) {
		res.status(200).redirect(req.app.locals.paths.businessCards());
		return;
	}
	const bc = req.session.bc;
	if (!bc || !bc.filter || !bc.filter.single) {
		res.status(200).redirect(req.app.locals.paths.businessCards());
		return;
	}
	const filter = req.session.bc.filter;
	filter.or = filter.or || [];

	const group = [];
	Object.keys(input).forEach((index) => {
		group.push(filter.single[index]);
		delete filter.single[index];
	});
	filter.single = filter.single.filter(v => v);
	filter.or.push(group);

	res.status(200).redirect(req.app.locals.paths.businessCards());
});

module.exports = router;
