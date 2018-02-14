const express = require('express');

const router = express.Router();

router.get('/new', (req, res) => {
	res.render('newNews', { title: 'News', content: '<p>lololol<em>crap</em></p><br />' });
});

module.exports = router;
