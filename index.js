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

// connect to database
const dbUrl = new url.URL(process.env.DB_HOST);
dbUrl.port = process.env.DB_PORT;
dbUrl.pathname = process.env.DB_NAME;
mongoose.connect(dbUrl.toString(), { user: process.env.DB_USER, pass: process.env.DB_PWD });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// defining routing paths
function pathWithId(base, arg) {
	if (typeof arg === 'string') {
		return `${base}/${arg}`;
	}
	if (arg && arg._id) {
		return `${base}/${arg._id.toString()}`;
	}
	return base;
}
app.locals.paths = {};
app.locals.paths.home = () => '/';
app.locals.paths.signIn = () => '/sessions/new';
app.locals.paths.users = user => pathWithId('/users', user);
app.locals.paths.userEdit = user => pathWithId(path.join(app.locals.paths.users(), 'edit'), user);
app.locals.paths.sessions = () => '/sessions';
app.locals.paths.signUpAccess = () => '/signUpAccess';
app.locals.paths.news = news => pathWithId('/news', news);
app.locals.paths.newsPreview = () => path.join(app.locals.paths.news(), 'preview');

// routing
const mustBeSignedIn = authHelper.mustBeSignedIn;
app.use('/users', require('./user/index'));
app.use('/sessions', require('./session/index'));
app.use('/news', mustBeSignedIn, require('./news/index'));
const signUpAccessRouter = require('./signUpAccess/index'); // eslint-disable-line import/newline-after-import
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
