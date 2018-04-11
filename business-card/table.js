const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
	headerList: {
		type: [String],
	},
	rowList: [[String]],
});

const Table = mongoose.model('Table', tableSchema);
module.exports = Table;
