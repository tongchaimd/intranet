const express = require('express');
const News = require('./news');

const router = express.Router();

router.get('/new', (req, res) => {
	res.render('newNews', { title: 'News' });
});

router.post('/', (req, res) => {
	const input = req.body;
	const news = new News({
		title: input.title,
		markedupContent: input.markedupContent,
		sourceUrl: input.sourceUrl,
		poster: req.currentUser._id,
		postedAt: new Date(),
		updatedAt: new Date(),
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
		.then((news) => {
			res.render('news', { ...news.toObject(), imageSourceArray: news.imageSourceArray });
		});
});

router.post('/preview', (req, res) => {
	const input = req.body;
	if (input.title && input.markedupContent) {
		res.render('partials/news', input);
	} else {
		res.status(400).send('ERROR 400: bad request');
	}
});

module.exports = router;
