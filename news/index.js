const express = require('express');
const News = require('./news');
const upload = require('multer')();
const stream = require('stream');
const asyncMw = require('../helpers/async-middleware');

const router = express.Router();

router.get('/new', (req, res) => {
	res.render('news/new');
});

router.post('/', upload.single('file'), asyncMw(async (req, res) => {
	const input = req.body;
	const news = new News({
		title: input.title,
		markedupContent: input.markedupContent,
		sourceUrl: input.sourceUrl,
		poster: req.currentUser._id,
	});
	if (input.imageSourceArray) {
		if (!Array.isArray(input.imageSourceArray)) {
			input.imageSourceArray = [input.imageSourceArray];
		}
		if (input.imageSourceArray.length) {
			const dataUrlRegex = /^data:.+\/(.+);base64,(.*)$/;
			input.imageSourceArray.forEach((source) => {
				const matches = source.match(dataUrlRegex);
				const contentType = matches[1];
				const data = Buffer.from(matches[2], 'base64');
				news.images.push({ contentType, data });
			});
		}
	}
	const fileStream = new stream.PassThrough();
	fileStream.end(req.file.buffer);
	await news.saveFile(fileStream, req.file.originalname);
	const savedNews = await news.save();
	res.end(req.app.locals.paths.news(savedNews));
}));

router.get('/:id', asyncMw(async (req, res) => {
	const news = await News.findById(req.params.id).populate('poster');
	res.render('news/show', { news });
}));

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

router.get('/', asyncMw(async (req, res) => {
	let searchCondition = {};
	if (req.query.search) {
		searchCondition = { $text: { $search: req.query.search } };
	}
	const result = await News.paginate(searchCondition, {
		page: req.query.page || 1,
		limit: 10,
		sort: { createdAt: 'desc' },
		populate: 'poster',
	});
	res.render('news/index', { newsList: result.docs, currentPage: +result.page, pageCount: +result.pages, search: req.query.search });
}));

router.get('/:id/images', asyncMw(async (req, res) => {
	const doc = await News.findById(req.params.id);
	res.json(doc.getImageSourceArray(+req.query.start, +req.query.end));
}));

router.get('/:id/file', asyncMw(async (req, res) => {
	const doc = await News.findById(req.params.id);
	const metadata = await doc.getFileMetadata();
	res.writeHead(200, {
		'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'Content-Disposition': `attachment; filename*= UTF-8''${encodeURIComponent(metadata.filename)}`,
	});
	doc.getFileReadStream().pipe(res);
}));

router.delete('/:id', asyncMw(async (req, res) => {
	const doc = await News.findOneAndRemove({ _id: req.params.id });
	if (doc) {
		req.flash('success', 'successfully remove the news');
		res.status(200).end();
	} else {
		throw Error('news not found');
	}
}));

module.exports = router;
