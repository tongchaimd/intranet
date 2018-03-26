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

multiLangStringSchema.methods.prefer = function prefer(prefLang, def) {
	const obj = this.toObject();
	if(obj[prefLang]) return obj[prefLang];
	const keys = Object.keys(obj)
	for(let i = 0; i < keys.length; i = i + 1) {
		if(obj[keys[i]]) return obj[keys[i]];
	}
	return def;
}

const multiLangPaths = ['fullName', 'position', 'companyName', 'companyLocation'];
const multiLangPathsObj = multiLangPaths.reduce((obj, path) => {
	obj[path] = { type: multiLangStringSchema, default: {} };
	return obj;
}, {});

const businessCardSchema = new mongoose.Schema({
	...multiLangPathsObj,
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

businessCardSchema.statics.isMultiLang = function isMultiLang(path) {
	return multiLangPaths.includes(path);
};

businessCardSchema.plugin(mongoosePaginate);

const BusinessCard = mongoose.model('BusinessCard', businessCardSchema);

module.exports = BusinessCard;
