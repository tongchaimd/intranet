var express = require('express');
var router = express.Router();

router.get('/new', function(req, res) {
	res.render('newNews', {title: 'News', content: '<p>lololol<em>crap</em></p><br />'});
});

module.exports = router;