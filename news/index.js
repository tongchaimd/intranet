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
});

router.post('/preview', (req, res) => {
	const input = req.body;
	if (input.title && input.markedupContent) {
		res.render('news', input);
	} else {
		res.status(400).send('ERROR 400: bad request');
	}
});

module.exports = router;
