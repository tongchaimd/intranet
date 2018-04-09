// imports
require('dotenv').config();
const mongoose = require('mongoose');
const url = require('url');
const path = require('path');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const buildTitle = require('./helpers/build-title');
const authHelper = require('./helpers/authorization');
const methodOverride = require('method-override');
const sgMail = require('@sendgrid/mail');
const moment = require('moment');
const queryString = require('query-string');
const express = require('express');

const app = express();

// app setting and middleware
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.set('views', './views');
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(session({
	saveUninitialized: false,
	secret: process.env.COOKIE_SECRET,
	resave: false,
}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(flash());
app.use(authHelper.currentUserMiddleware); // expose req.currentUser to Controllers
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
app.locals.sgMail = sgMail;
app.locals.helpers = {};
app.use((req, res, next) => {
	res.locals.helpers = {};
	res.locals.helpers.buildTitle = buildTitle;
	res.locals.helpers.moment = moment;
	const format = { arrayFormat: 'index' };
	// keep old queryString
	res.locals.helpers.relQString = (obj) => {
		return `?${queryString.stringify({...req.query, ...obj}, format)}`;
	}
	res.locals.helpers.addQStringArray = (obj) => {
		const newQuery = JSON.parse(JSON.stringify(req.query));
		Object.keys(obj).forEach((key) => {
			if(!newQuery[key]) {
				newQuery[key] = [];
			}
			newQuery[key].push(obj[key]);
		})
		return `?${queryString.stringify(newQuery, format)}`;
	}
	res.locals.helpers.qStringArrayAddingTemplate = (key) => {
		if(req.query[key] && req.query[key].length) {
			return `?${queryString.stringify(req.query, format)}&${key}[${req.query[key].length}]=`;
		}
		return `?${queryString.stringify(req.query, format)}&${key}[${0}]=`;
	}
	res.locals.helpers.remQStringArray = (obj) => {
		const newQuery = JSON.parse(JSON.stringify(req.query));
		Object.keys(obj).forEach((key) => {
			if(newQuery[key]) {
				newQuery[key].splice(obj[key],1);
				if(!newQuery[key].length) {
					delete newQuery[key];
				}
			}
		})
		return `?${queryString.stringify(newQuery, format)}`;
	}
	res.locals.helpers.remQStringNestedArray = (obj) => {
		const newQuery = JSON.parse(JSON.stringify(req.query));
		Object.keys(obj).forEach((key) => {
			if(newQuery[key]) {
				if(newQuery[key][obj[key][0]]) {
					const arr = newQuery[key][obj[key][0]].split(',');
					arr.splice(obj[key][1], 1);
					newQuery[key][obj[key][0]] = arr.join(',');
				}
			}
		})
		return `?${queryString.stringify(newQuery, format)}`;
	}
	next();
});

// connect to database
const dbUrl = new url.URL(process.env.DB_HOST);
dbUrl.port = process.env.DB_PORT;
dbUrl.pathname = process.env.DB_NAME;
mongoose.connect(dbUrl.toString(), { user: process.env.DB_USER, pass: process.env.DB_PWD });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// defining routing paths
function resolvePath(...argList) {
	if (!argList.length) {
		return '/';
	}
	return argList.reduce((result, arg) => {
		if (!arg) {
			return result;
		}
		if (arg._id) {
			return path.join(result, `${arg._id.toString()}/`);
		}
		return path.join(result, `${arg}/`);
	}, '/');
}
app.locals.paths = {};
app.locals.paths.home = () => '/';
app.locals.paths.signIn = () => '/sessions/new/';
app.locals.paths.users = user => resolvePath('/users/', user);
app.locals.paths.userEdit = user => resolvePath(app.locals.paths.users(), 'edit', user);
app.locals.paths.signUp = () => resolvePath(app.locals.paths.users(), 'new');
app.locals.paths.sessions = () => '/sessions/';
app.locals.paths.signUpAccess = () => '/signUpAccess/';
app.locals.paths.invite = () => resolvePath(app.locals.paths.signUpAccess(), 'new');
app.locals.paths.news = news => resolvePath('/news/', news);
app.locals.paths.newNews = () => resolvePath(app.locals.paths.news(), 'new');
app.locals.paths.newsPreview = () => resolvePath(app.locals.paths.news(), 'preview');
app.locals.paths.newsImages = news => resolvePath(app.locals.paths.news(news), 'images');
app.locals.paths.businessCards = card => resolvePath('/businessCards/', card);
app.locals.paths.newBusinessCard = () => resolvePath(app.locals.paths.businessCards(), 'new');
app.locals.paths.editBusinessCard = card => resolvePath(app.locals.paths.businessCards(), card, 'edit');
app.locals.paths.businessCardsBasket = () => resolvePath(app.locals.paths.businessCards(), 'basket');
app.locals.paths.businessCardsBasketTable = () => resolvePath(app.locals.paths.businessCards(), 'basket', 'table');
app.locals.paths.businessCardsTags = () => resolvePath(app.locals.paths.businessCards(), 'tags');
app.locals.paths.businessCardsOrGroup = () => resolvePath(app.locals.paths.businessCards(), 'orGroup');
app.locals.paths.businessCardsImport = () => resolvePath(app.locals.paths.businessCards(), 'import');

// routing
const mustBeSignedIn = authHelper.mustBeSignedIn;
const mustBeAdmin = authHelper.mustBeAdmin;
app.use('/users', require('./user/index'));
app.use('/sessions', require('./session/index'));
app.use('/news', mustBeSignedIn, require('./news/index'));
app.use('/businessCards', mustBeSignedIn, require('./business-card/index'));
const signUpAccessRouter = require('./sign-up-access/index'); // eslint-disable-line import/newline-after-import
if (process.env.NODE_ENV === 'development') {
	app.use('/signUpAccess', signUpAccessRouter);
} else {
	app.use('/signUpAccess', mustBeAdmin, signUpAccessRouter);
}
app.use((err, req, res, next) => {
	console.log(err);
	res.status(500).render('errors/500');
});
app.use((req,res) => {
	res.status(400).render('errors/404');
});

app.listen(process.env.PORT);
