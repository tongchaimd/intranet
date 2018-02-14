// imports
const mongoose = require('mongoose');
const url = require('url');
const path = require('path');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const session = require('express-session');
const common = require('./helpers/common');
const express = require('express');
require('dotenv').config();

const app = express();

// app setting and middleware
app.set('views', './views');
app.set('view engine', 'jade');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
	saveUninitialized: false,
	secret: 'my little pony',
	resave: false,
}));
app.use(flash());
app.use(common.titleMiddleware);
app.use(common.currentUserMiddleware);

// connect to database
const dbUrl = new url.URL(process.env.DB_HOST);
dbUrl.port = process.env.DB_PORT;
dbUrl.pathname = process.env.DB_NAME;
mongoose.connect(dbUrl.toString());
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// routing
app.get('/something', (req, res) => {
	res.end('anything');
});
app.use('/users', require('./user/index'));
app.use('/sessions', require('./session/index'));
app.use('/signupAccess', require('./signupAccess/index'));
app.use('/news', require('./news/index'));
app.get('/sumtingwong', (req, res) => {
	res.render('sumtingwong');
});
// app.get('/', (req, res) => {
// 	res.redirect('/signup');
// });

app.listen(process.env.PORT);
