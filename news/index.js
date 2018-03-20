const express = require('express');
const News = require('./news');

const router = express.Router();

router.get('/new', (req, res) => {
	res.render('news/new');
});

router.post('/', (req, res) => {
	const input = req.body;
	const news = new News({
		title: input.title,
		markedupContent: input.markedupContent,
		sourceUrl: input.sourceUrl,
		poster: req.currentUser._id,
	});
	if (input.imageSourceArray && input.imageSourceArray.length) {
		const dataUrlRegex = /^data:.+\/(.+);base64,(.*)$/;
		input.imageSourceArray.forEach((source) => {
			const matches = source.match(dataUrlRegex);
			const contentType = matches[1];
			const data = Buffer.from(matches[2], 'base64');
			news.images.push({ contentType, data });
		});
	}
	news.save()
		.then((savedNews) => {
			res.end(`/news/${savedNews._id.toString()}`);
		})
		.catch((err) => {
			console.error(err);
		});
});

router.get('/:id', (req, res) => {
	News.findById(req.params.id)
		.populate('poster')
		.then((news) => {
			res.render('news/show', { news });
		});
});

router.post('/preview', (req, res) => {
	const input = req.body;
	const news = {
		title: input.title,
		markedupContent: input.markedupContent,
		sourceUrl: input.sourceUrl,
		poster: req.currentUser,
		getImageSourceArray: () => input.imageSourceArray,
	};
	if (input.title && input.markedupContent) {
		res.render('news/partials/news', { news });
	} else {
		res.status(400).send('ERROR 400: bad request');
	}
});

router.get('/', (req, res) => {
	News.find()
		.populate('poster')
		.then((newsList) => {
			res.render('news/index', { newsList });
		})
		.catch((err) => {
			console.log(err);
		});
});

router.get('/:id/images', (req, res) => {
	News.findById(req.params.id)
		.then((doc) => {
			res.json(doc.getImageSourceArray(+req.query.start, +req.query.end));
		})
		.catch((err) => {
			console.log(err);
		});
});

module.exports = router;
