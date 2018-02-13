var mongoose = require('mongoose');

var newsSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	content: {
		type: String,
		required: true
	},
	postedAt: {
		type: Date,
		required: true
	},
	updatedAt: {
		type: Date,
		required: true
	},
	poster: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	sourceUrl: {
		type: String
	}
});

var News = mongoose.model('News', newsSchema);

module.exports = News;