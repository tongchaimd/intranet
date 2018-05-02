const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
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
		type: String,
	},
	sourceUrl: {
		type: String,
	},
	images: [new mongoose.Schema({
		data: Buffer,
		contentType: String,
	})],
	fileId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
}, { timestamps: true });

newsSchema.index({
	title: 'text',
	markedupContent: 'text',
	poster: 'text',
});

newsSchema.methods.getImageSourceArray = function getImageSourceArray(start, end) {
	if (!this.images || !this.images.length) return [];
	start = start || 0;
	end = end || this.images.length;
	return this.images.slice(start, end).map(image => `data:${image.contentType};base64,${image.data.toString('base64')}`);
};

newsSchema.methods.saveFile = function saveFile(readStream, name) {
	return new Promise((resolve, reject) => {
		const gfs = Grid(mongoose.connection.db, mongoose.mongo);
		const writeStream = gfs.createWriteStream({ filename: name });
		readStream.pipe(writeStream);

		readStream.on('error', err => reject(err));

		writeStream.on('close', (file) => {
			this.fileId = file._id;
			return resolve(file);
		});
	});
};

newsSchema.methods.getFileMetadata = function getFileMetadata() {
	return new Promise((resolve, reject) => {
		if (!this.fileId) {
			return reject(new Error('no fileId'));
		}
		const gfs = Grid(mongoose.connection.db, mongoose.mongo);
		gfs.files.find({ _id: this.fileId }).toArray((err, files) => {
			if (err) {
				return reject(err);
			}
			return resolve(files[0]);
		});
	});
};

newsSchema.methods.getFileReadStream = function getFileReadStream() {
	if (!this.fileId) {
		return null;
	}
	const gfs = Grid(mongoose.connection.db, mongoose.mongo);
	return gfs.createReadStream({ _id: this.fileId });
};

newsSchema.plugin(mongoosePaginate);

const News = mongoose.model('News', newsSchema);

module.exports = News;
