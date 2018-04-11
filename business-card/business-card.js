const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Fuse = require('fuse.js');

let fuse;
const languageList = ['english', 'chinese', 'thai'];
const languageListObj = languageList.reduce((obj, path) => {
	obj[path] = { type: String, default: '' };
	return obj;
}, {});
const multiLangStringSchema = new mongoose.Schema({
	...languageListObj,
}, { _id: false });

multiLangStringSchema.methods.prefer = function prefer(prefLang, def) {
	const obj = this.toObject();
	if (obj[prefLang]) return obj[prefLang];
	const keys = Object.keys(obj);
	for (let i = 0; i < keys.length; i += 1) {
		if (obj[keys[i]]) return obj[keys[i]];
	}
	return def;
};

const multiLangPaths = ['fullName', 'position', 'companyName', 'companyLocation'];
const multiLangPathsWithIndex = ['fullName', 'companyName'];
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
	tagList: {
		type: [String],
		default: [],
		index: true,
		validate: {
			// commas will be used to seperate groups of tag filters in the querystring
			validator: function noCommaValidator(list) {
				return list.every(v => !v.includes(','));
			},
			message: 'Tags must not include comma(,)',
		},
	},
	wcId: {
		type: String,
		index: true,
	},
	imageFront: {
		type: Buffer,
	},
	imageBack: {
		type: Buffer,
	}
}, { timestamps: true });

multiLangPathsWithIndex.forEach((path) => {
	languageList.forEach((language) => {
		businessCardSchema.index({ [`${path}.${language}`]: 1 });
	});
});

businessCardSchema.statics.isMultiLang = function isMultiLang(path) {
	return multiLangPaths.includes(path);
};

function getLanguageList() {
	return languageList;
}

businessCardSchema.statics.getTagsByPopularity = function getTagsByPopularity() {
	return this.aggregate()
		.unwind('$tagList')
		.group({
			_id: '$tagList',
			count: { $sum: 1 },
		})
		.sort({ count: -1 });
};


businessCardSchema.statics.search = function search(query) {
	if (!fuse) {
		updateFuse();
		return [];
	} else {
		return fuse.search(query);
	}
};

businessCardSchema.statics.languageList = getLanguageList;
businessCardSchema.methods.languageList = getLanguageList;

businessCardSchema.plugin(mongoosePaginate);

businessCardSchema.post('update', updateFuse);
businessCardSchema.post('save', updateFuse);
businessCardSchema.post('remove', updateFuse);
businessCardSchema.post('insertMany', updateFuse);

const BusinessCard = mongoose.model('BusinessCard', businessCardSchema);

async function updateFuse() {
	try {
		const tagList = await BusinessCard.getTagsByPopularity();
		fuse = new Fuse(tagList, {
			shouldSort: true,
			threshold: 0.4,
			location: 0,
			distance: 100,
			maxPatternLength: 32,
			minMatchCharLength: 1,
			keys: ['_id'],
		});
	} catch (err) {
		console.log(err);
	}
}

module.exports = BusinessCard;
