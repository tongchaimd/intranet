const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const multiLangStringSchema =  new mongoose.Schema({
	english: {
		type: String,
		default: '',
	},
	thai: {
		type: String,
		default: '',
	},
	chinese: {
		type: String,
		default: '',
	},
}, { _id: false });

const businessCardSchema = new mongoose.Schema({
	fullName: {
		type: multiLangStringSchema,
		default: {},
	},
	position: {
		type: multiLangStringSchema,
		default: {},
	},
	companyName: {
		type: multiLangStringSchema,
		default: {},
	},
	companyLocation: {
		type: multiLangStringSchema,
		default: {},
	},
	phone: {
		type: String,
		default: '',
	},
	mobile: {
		type: String,
		default: '',
	},
	fax: {
		type: String,
		default: '',
	},
	email: {
		type: String,
		default: '',
	},
	website: {
		type: String,
		default: '',
	},
}, { timestamps: true });

businessCardSchema.plugin(mongoosePaginate);

const BusinessCard = mongoose.model('BusinessCard', businessCardSchema);

module.exports = BusinessCard;
