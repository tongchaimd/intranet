const express = require('express');
const BusinessCard = require('./business-card');
const queryString = require('query-string');
const authHelper = require('../helpers/authorization');
const asyncMw = require('../helpers/async-middleware');

const router = express.Router();

router.use('/basket', require('./basket'));
router.use('/import', require('./import'));
router.use('/config', require('./config'));

async function renderForm(res, card, isNew) {
	const popularTags = await BusinessCard.getTagsByPopularity();
	res.render('business-cards/form', {
		languageList: BusinessCard.languageList(),
		popularTags,
		card,
		isNew,
	});
}

router.get('/new', asyncMw(async (req, res) => {
	renderForm(res, new BusinessCard(), true);
}));

function extractLanguageSpecificFields(form) {
	const input = {};
	Object.keys(form).forEach((key) => {
		if (form[key]) {
			const matches = key.match(/(.+)-(.+)/);
			if (matches) {
				const language = matches[1];
				const realKey = matches[2];
				if (!input[realKey]) {
					input[realKey] = {};
				}
				input[realKey][language] = form[key];
			} else {
				input[key] = form[key];
			}
		}
	});
	return input;
}

router.post('/', asyncMw(async (req, res) => {
	const input = extractLanguageSpecificFields(req.body);
	const businessCard = new BusinessCard(input);
	const error = businessCard.validateSync();
	if (error) {
		Object.values(error.errors).forEach((validationError) => {
			req.flash('danger', validationError.message);
		});
		await renderForm(res, new BusinessCard(input), true);
		return;
	}
	await businessCard.save();
	req.flash('success', 'Business Card Saved');
	res.redirect(req.app.locals.paths.newBusinessCard());
}));

router.get('/', asyncMw(async (req, res) => {
	req.session.bc = req.session.bc || {};
	const preferLang = req.session.bc.preferLanguage || 'english';
	const sortBy = req.session.bc.sort || 'createdAt';
	const pathString = BusinessCard.isMultiLang(sortBy) ? `${sortBy}.${preferLang}` : sortBy;
	const direction = req.session.bc.direction || 'desc';

	let tagQuery = {};
	const filter = req.session.bc.filter;
	if (filter) {
		const toCondition = tag => ({ tagList: tag });
		const groups = [];

		if (filter.or) {
			console.log(filter.or
				.map(group => ({ $or: group.map(toCondition) })));
			groups.push(...filter.or
				.map(group => ({ $or: group.map(toCondition) })));
		}
		if (filter.single) {
			groups.push(...filter.single.map(toCondition));
			console.log(filter.single.map(toCondition));
		}

		if (groups.length) {
			tagQuery = { $and: groups };
		}
	}

	const result = await BusinessCard.paginate({
			$and: [
				{ [pathString]: { $exists: true, $ne: '' } },
				tagQuery,
			],
		}, {
			page: req.query.page || 1,
			sort: { [pathString]: direction },
			limit: 20,
		});
	if (result.pages < result.page) {
		res.redirect(res.locals.helpers.relQString({ page: 1 }))
		return;
	}
	res.render('business-cards/index', {
		cardList: result.docs,
		currentPage: +result.page,
		pageCount: +result.pages,
		preferLang,
		sortBy,
		direction,
		languageList: BusinessCard.languageList(),
		basket: req.session.basket || [],
		filter,
	});
}));

router.get('/tags', (req, res) => {
	const search = req.query.search;
	res.json(BusinessCard.search(search).map(i => i._id));
});

router.post('/orGroup', (req, res) => {
	const memberIndices = Object.keys(req.body).map(m => +m);
	const memberList = req.query.filter.filter((v, i) => memberIndices.includes(i))
	req.query.filter = req.query.filter.filter((v, i) => !memberIndices.includes(i));
	req.query.filter.push(memberList.join(','))
	res.redirect(`${req.app.locals.paths.businessCards()}?${queryString.stringify(req.query, { arrayFormat: 'index' })}`)
});

router.get('/:id', asyncMw(async (req, res) => {
	const card = await BusinessCard.findById(req.params.id);
	res.render('business-cards/show', {
		card,
	});
}));

router.get('/:id/edit', asyncMw(async (req, res) => {
	const card = await BusinessCard.findById(req.params.id);
	renderForm(res, card);
}));

router.patch('/:id', asyncMw(async (req, res) => {
	const input = extractLanguageSpecificFields(req.body);
	if (!input.tagList) {
		input.tagList = [];
	}
	const card = await BusinessCard.findById(req.params.id);
	card.set(input);

	const error = card.validateSync();
	if (error) {
		Object.values(error.errors).forEach((validationError) => {
			req.flash('danger', validationError.message);
		});
		await renderForm(res, card);
		return;
	}

	await card.save();
	res.redirect(req.app.locals.paths.businessCards(card));
}));

router.delete('/:id', asyncMw(async (req, res) => {
	const doc = await BusinessCard.findOneAndRemove({ _id: req.params.id });
	if (doc) {
		req.flash('success', 'successfully remove the card');
		res.status(200).end();
	} else {
		throw Error('card not found');
	}
}));

module.exports = router;
