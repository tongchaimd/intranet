const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	content: {
		type: String,
		required: true,
	},
	postedAt: {
		type: Date,
		required: true,
	},
	updatedAt: {
		type: Date,
		required: true,
	},
	poster: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	sourceUrl: {
		type: String,
	},
});

const News = mongoose.model('News', newsSchema);

module.exports = News;
