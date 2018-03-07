const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	markedupContent: {
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
	images: [new mongoose.Schema({
		data: Buffer,
		contentType: String,
	})],
});

newsSchema.virtual('imageSourceArray')
	.get(function getImageSourceArray() {
		return this.images.map(image => `data:${image.contentType};base64,${image.data.toString('base64')}`);
	});

const News = mongoose.model('News', newsSchema);

module.exports = News;
