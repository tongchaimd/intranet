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

router.get('/', (req, res) => {
	const preferLang = req.query.prefLang || 'english';
	const sortBy = req.query.sort || 'createdAt';
	const pathString = BusinessCard.isMultiLang(sortBy) ? `${sortBy}.${preferLang}` : sortBy;
	const direction = req.query.direction || 'desc';
	BusinessCard.paginate({ [pathString]: {'$exists': true, '$ne': ''} }, {
		page: req.query.page || 1,
		sort: { [pathString]: direction },
		limit: 20,
	})
		.then((result) => {
			res.render('business-cards/index', {
				cardList: result.docs,
				currentPage: +result.page,
				pageCount: +result.pages,
				preferLang,
				languageList: ['english', 'thai', 'chinese'],
				sortBy,
				direction,
			});
		})
		.catch((err) => {
			console.log(err);
		});
});

router.get('/:id', (req, res) => {
	BusinessCard.findById(req.params.id)
		.then((card) => {
			res.render('business-cards/show', {
				card,
				languageList: ['english', 'chinese', 'thai'],
			});
		})
		.catch((err) => {
			console.log(err);
		});
});

module.exports = router;
