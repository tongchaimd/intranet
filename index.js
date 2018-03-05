// imports
const mongoose = require('mongoose');
const url = require('url');
const path = require('path');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const session = require('express-session');
const common = require('./helpers/common');
const authHelper = require('./helpers/authorization');
const express = require('express');
require('dotenv').config();

const app = express();

// app setting and middleware
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', './views');
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(session({
	saveUninitialized: false,
	secret: process.env.COOKIE_SECRET,
	resave: false,
}));
app.use(flash());
app.use(common.titleMiddleware); // expose buildTitle helper to Controllers
app.use(authHelper.currentUserMiddleware); // expose req.currentUser to Controllers

// connect to database
const dbUrl = new url.URL(process.env.DB_HOST);
dbUrl.port = process.env.DB_PORT;
dbUrl.pathname = process.env.DB_NAME;
mongoose.connect(dbUrl.toString());
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// routing
app.locals.homePath = '/';
app.locals.signInPath = '/sessions/new';
const mustBeSignedIn = authHelper.mustBeSignedIn;
app.use('/users', require('./user/index'));
app.use('/sessions', require('./session/index'));
app.use('/signupAccess', mustBeSignedIn, require('./signupAccess/index'));
app.use('/news', mustBeSignedIn, require('./news/index')); // eslint-disable-line import/newline-after-import
app.get('/sumtingwong', (req, res) => {
	res.render('sumtingwong');
});

app.listen(process.env.PORT);
