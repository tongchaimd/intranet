const express = require('express');
const News = require('./news');
const upload = require('multer')();
const stream = require('stream');

const router = express.Router();

router.get('/new', (req, res) => {
	res.render('news/new');
});

router.post('/', upload.single('file'), (req, res) => {
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
	news.saveFile(fileStream, req.file.originalname)
		.then(() => {
			return news.save()
		})
		.then((savedNews) => {
			res.end(req.app.locals.paths.news(savedNews));
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
	News.paginate({}, {
		page: req.query.page || 1,
		limit: 10,
		sort: { createdAt: 'desc' },
		populate: 'poster',
	})
		.then((result) => {
			res.render('news/index', { newsList: result.docs, currentPage: +result.page, pageCount: +result.pages });
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

router.get('/:id/file', async (req, res) => {
	try {
		const doc = await News.findById(req.params.id);
		const metadata = await doc.getFileMetadata();
		res.writeHead(200, {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'Content-Disposition': `attachment; filename*= UTF-8''${encodeURIComponent(metadata.filename)}`,
		});
		doc.getFileReadStream().pipe(res);
	} catch (err) {
		console.log(err);
	};
});

module.exports = router;
