const express = require('express');
const BusinessCard = require('./business-card');
const queryString = require('query-string');

const router = express.Router();

router.use('/basket', require('./basket'));
router.use('/import', require('./import'));

function renderForm(res, card, isNew) {
	BusinessCard.getTagsByPopularity()
		.then((popularTags) => {
			res.render('business-cards/form', {
				languageList: BusinessCard.languageList(),
				popularTags,
				card,
				isNew,
			});
		});
}

router.get('/new', (req, res) => {
	renderForm(res, new BusinessCard(), true);
});

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

router.post('/', (req, res) => {
	const input = extractLanguageSpecificFields(req.body);
	const businessCard = new BusinessCard(input);
	businessCard.save()
		.then(() => {
			req.flash('success', 'Business Card Saved');
			res.redirect(req.app.locals.paths.newBusinessCard());
		})
		.catch((err) => {
			if (err.name === 'ValidationError') {
				Object.values(err.errors).forEach((validationError) => {
					req.flash('danger', validationError.message);
				});
				renderForm(res, new BusinessCard(input), true);
			}
		})
		.catch((err) => {
			console.log(err);
		});
});

router.get('/', (req, res) => {
	const preferLang = req.query.prefLang || 'english';
	const sortBy = req.query.sort || 'createdAt';
	const pathString = BusinessCard.isMultiLang(sortBy) ? `${sortBy}.${preferLang}` : sortBy;
	const direction = req.query.direction || 'desc';

	let tagQuery = {};
	const filterList = req.query.filter || [];
	if (filterList.length) {
		const toCondition = tag => ({ tagList: tag });
		const groups = filterList
			.map(v => v.split(','))
			.map(group => ({ $or: group.map(toCondition) }));

		tagQuery = { $and: groups };
	}

	BusinessCard.paginate({
		$and: [
			{ [pathString]: { $exists: true, $ne: '' } },
			tagQuery,
		],
	}, {
		page: req.query.page || 1,
		sort: { [pathString]: direction },
		limit: 20,
	})
		.then((result) => {
			if (result.pages < result.page) {
				res.redirect(res.locals.helpers.relQString({ page: 1 }))
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
				filterList,
			});
		})
		.catch((err) => {
			console.log(err);
		});
});

router.get('/tags', async (req, res) => {
	try {
		const search = req.query.search;
		res.json(BusinessCard.search(search).map(i => i._id));
	} catch (err) {
		console.log(err);
	}
});

router.post('/orGroup', (req, res) => {
	const memberIndices = Object.keys(req.body).map(m => +m);
	const memberList = req.query.filter.filter((v, i) => memberIndices.includes(i))
	req.query.filter = req.query.filter.filter((v, i) => !memberIndices.includes(i));
	req.query.filter.push(memberList.join(','))
	res.redirect(`${req.app.locals.paths.businessCards()}?${queryString.stringify(req.query, { arrayFormat: 'index' })}`)
});

router.get('/:id', (req, res) => {
	BusinessCard.findById(req.params.id)
		.then((card) => {
			res.render('business-cards/show', {
				card,
			});
		})
		.catch((err) => {
			console.log(err);
		});
});

router.get('/:id/edit', (req, res) => {
	let card;
	BusinessCard.findById(req.params.id)
		.then((doc) => {
			card = doc;
			return renderForm(res, card);
		})
		.catch((err) => {
			console.log(err);
		});
});

router.patch('/:id', (req, res) => {
	const input = extractLanguageSpecificFields(req.body);
	let card;
	BusinessCard.findById(req.params.id)
		.then((doc) => {
			card = doc;
			return card.update({ tagList: [], ...input }, { runValidators: true });
		})
		.then(() => {
			res.redirect(req.app.locals.paths.businessCards(card));
		})
		.catch((err) => {
			if (err.name === 'ValidationError') {
				Object.values(err.errors).forEach((validationError) => {
					req.flash('danger', validationError.message);
				});
				renderForm(res, new BusinessCard(input));
			}
			throw err;
		})
		.catch((err) => {
			console.log(err);
		});
});


module.exports = router;
