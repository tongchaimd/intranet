var express = require('express');
var app = express();

// imports
var mongoose = require('mongoose');
var config = require('config');
var url = require('url');
var path = require('path');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');
var common = require('./helpers/common');

// load configs
var appConfig = config.get('app')
var dbConfig = config.get('db');

// app setting and middleware
app.set('views', './views');
app.set('view engine', 'jade');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
	saveUninitialized: false,
	secret: 'my little pony',
	resave: false
}));
app.use(flash());
app.use(common.titleMiddleware);
app.use(common.currentUserMiddleware);

// connect to database
var dbUrl = new url.URL(dbConfig.host);
dbUrl.port = dbConfig.port;
dbUrl.pathname = dbConfig.dbName;
mongoose.connect(dbUrl.toString());
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// routing
app.get('/something', (req,res) => {
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

app.listen(appConfig.port);
