// imports
const mongoose = require('mongoose');
const url = require('url');
const path = require('path');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const common = require('./helpers/common');
const authHelper = require('./helpers/authorization');
const methodOverride = require('method-override');
const sgMail = require('@sendgrid/mail');
const express = require('express');
require('dotenv').config();

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
app.locals.buildTitle = common.buildTitle;
app.locals.moment = require('moment');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
app.locals.sgMail = sgMail;

// connect to database
const dbUrl = new url.URL(process.env.DB_HOST);
dbUrl.port = process.env.DB_PORT;
dbUrl.pathname = process.env.DB_NAME;
mongoose.connect(dbUrl.toString(), { user: process.env.DB_USER, pass: process.env.DB_PWD });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// defining routing paths
function resolvePath(...argList) {
	if(!argList.length) {
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
app.locals.paths.news = news => resolvePath('/news/', news);
app.locals.paths.newNews = () => resolvePath(app.locals.paths.news(), 'new');
app.locals.paths.newsPreview = () => resolvePath(app.locals.paths.news(), 'preview');
app.locals.paths.newsImages = news => resolvePath(app.locals.paths.news(news), 'images');
app.locals.paths.businessCards = () => '/businessCards/'
app.locals.paths.newBusinessCard = () => resolvePath(app.locals.paths.businessCards(), 'new');

// routing
const mustBeSignedIn = authHelper.mustBeSignedIn;
app.use('/users', require('./user/index'));
app.use('/sessions', require('./session/index'));
app.use('/news', mustBeSignedIn, require('./news/index'));
app.use('/businessCards', mustBeSignedIn, require('./business-card/index'));
const signUpAccessRouter = require('./sign-up-access/index'); // eslint-disable-line import/newline-after-import
if (process.env.NODE_ENV === 'development') {
	app.use('/signUpAccess', signUpAccessRouter);
} else {
	app.use('/signUpAccess', mustBeSignedIn, signUpAccessRouter);
}
app.get('/sumtingwong', (req, res) => {
	res.render('errors/sumtingwong');
});
app.use((req, res) => {
	res.status(404);

	res.render('errors/404');
});

app.listen(process.env.PORT);
