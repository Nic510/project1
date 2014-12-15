// Set up server
var express = require('express');
var methodOverride	=	require('method-override');
var ejs = require('ejs');
var app = express();
var db 	=	require('./db.js');
var bodyParser	=	require('body-parser');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname+'/public'));
app.use(methodOverride('_method'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(session({
secret: 'keyboard cat',
resave: false,
saveUninitialized: true
}))
//Users
var users = [
{ id: 1, username: 'dennis', password: 'samosa', email: 'dennis@ga.com' },
{ id: 2, username: 'cho', password: 'pineapple', email: 'cho@ga.com' },
{ id: 3, username: 'nic', password: 'weed', email: 'nic@ga.com' }];
function findByUsername(username, fn) {
for (var i = 0, len = users.length; i < len; i++) {
var user = users[i];
if (user.username === username) {
return fn(null, user);
}
}
return fn(null, null);
}
function findById(id, fn) {
var idx = id - 1;
if (users[idx]) {
fn(null, users[idx]);
} else {
fn(new Error('User ' + id + ' does not exist'));
}
}
//Serializer
passport.serializeUser(function(user, done) {
done(null, user.id);
});
// Deserializer
passport.deserializeUser(function(id, done) {
findById(id, function (err, user) {
done(err, user);
});
});
var localStrategy = new LocalStrategy(
function(username, password, done) {
findByUsername(username, function(err, user) {
if (err) { return done(err); }
if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
return done(null, user);
})
}
)
passport.use(localStrategy);
app.use(passport.initialize());
app.use(passport.session());

// Set up routes
app.get('/', function(req, res)	{
	res.render('index', {user: req.user});
});
app.get('/login', function(req, res) {
res.render('login');
});

app.get('/posts', function(req, res)	{
	db.query('SELECT * FROM posts;', function(err, dbRes) {
		if(!err) {
			res.render('posts/index', {posts: dbRes.rows});
		}
	});
});

// Add new post
app.get('/posts/new', function(req, res)	{
	res.render('posts/new')
});
//WORKS ^^^
// Wrong
app.get('/posts/:id', function(req, res)	{
	db.query('SELECT * FROM posts WHERE id = $1', [req.params.id], function(err, dbRes)	{
		if(!err) {
			res.render('posts/show', {posts: dbRes.rows[0]});
		}
	});
});
// Wrong^^^
// Wrong
app.post('/posts', function(req, res)	{
	var params	=	[req.body.author, req.body.title, req.body.body]
	db.query('INSERT INTO posts (author, title, body) VALUES ($1, $2, $3)', params, function(err, dbRes){
		if (!err){
			res.redirect('/posts');
		}
	});
});
// Wrong^^^
// Profile
app.get('/profile', function(req, res) {
console.log(req.user)
var user = req.user
res.render('profile');
});
// Logout
app.get('/logout', function(req, res) {
req.logout();
res.redirect('/')
});
// Login
app.post('/login', passport.authenticate('local',
{failureRedirect: '/login'}), function(req, res) {
res.redirect('/');
});
// // Edit people in table
// app.get('/posts/:id/edit', function(req, res)	{
// 	db.query("SELECT * FROM posts WHERE id = $1", [req.params.id], function(err, dbRes){
// 		if (!err) {
// 			res.render('posts/edit', { posts: dbRes.rows[0]});
// 		}
// 	});
// });
// // Set edited names to new value
// app.patch('/posts/:id', function(req, res)	{
// 	db.query("UPDATE posts SET author = $1, title = $2, body = $3 WHERE id = $4", [req.body.author, req.body.title, req.body.body, req.params.id], function(err, dbRes)	{
// 		if (!err)	{
// 			res.redirect('/posts/' + req.params.id);
// 		}
// 	});
// });
// // Delete from table
// app.delete('/posts/:id', function(req, res)	{
// 	db.query("DELETE FROM posts WHERE id = $1", [req.params.id], function(err,dbRes)	{
// 		if (!err)	{
// 			res.redirect('/posts');
// 		}
// 	})
// });

//Listen on port 3000
app.listen(4000);
//Inform about setup
console.log('Server is running!')