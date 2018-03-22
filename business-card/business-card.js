const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const multiLangStringSchema =  new mongoose.Schema({
	english: {
		type: String,
	},
	thai: {
		type: String,
	},
	chinese: {
		type: String,
	},
}, { _id: false });

const businessCardSchema = new mongoose.Schema({
	fullName: {
		type: multiLangStringSchema,
	},
	position: {
		type: multiLangStringSchema,
	},
	companyName: {
		type: multiLangStringSchema,
	},
	companyLocation: {
		type: multiLangStringSchema,
	},
	phone: {
		type: String,
	},
	mobile: {
		type: String,
	},
	fax: {
		type: String,
	},
	email: {
		type: String,
	},
	website: {
		type: String,
	},
}, { timestamps: true });

businessCardSchema.plugin(mongoosePaginate);

const BusinessCard = mongoose.model('BusinessCard', businessCardSchema);

module.exports = BusinessCard;
