const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const newsSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	markedupContent: {
		type: String,
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
}, { timestamps: true });

newsSchema.methods.getImageSourceArray = function getImageSourceArray(start, end) {
	if (!this.images || !this.images.length) return [];
	start = start || 0;
	end = end || this.images.length;
	return this.images.slice(start, end).map(image => `data:${image.contentType};base64,${image.data.toString('base64')}`);
};

newsSchema.plugin(mongoosePaginate);

const News = mongoose.model('News', newsSchema);

module.exports = News;
