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
// var bcrypt = require('bcrypt');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname+'/public'));
app.use(methodOverride('_method'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
secret: 'keyboard cat',
resave: false,
saveUninitialized: true
}))
//Users
var users = [
	{ id: 3, username: 'nic', password: 'hey', email: 'nic@ga.com' }
];


function findByName(name, fn) {
	db.query("select * from users where name=$1", [name], function(err, res) {
			console.log(null, res.rows);
			fn(null, res.rows[0])
	});
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

var localStrategy = new LocalStrategy(function(name, password, done) {
	findByName(name, function(err, user) {
		console.log("authenticating")
		console.log(user)
		if (err) { return done(err); }

		// if (!user) { 
		// 	return done(null, false, { message: 'Unknown user ' +user }); 
		// }
		// if (user.password != password) { 
		// 	return done(null, false, { message: 'Invalid password' }); 
		// }
		return done(null, user);
		})
	}
)


passport.use(localStrategy);
app.use(passport.initialize());
app.use(passport.session());

// Set up routes
// Good
app.get('/', function(req, res)	{
		db.query('SELECT * FROM images;', function(err, dbRes) {
		if(!err) {
			res.render('index', {images: dbRes.rows, user: req.user});
		}
	});
});
// Good
app.get('/login', function(req, res) {
	res.render('login');
});
//NOT Good
app.get('/posts', function(req, res)	{
	db.query('SELECT * FROM images;', function(err, dbRes) {
		if(!err) {
			res.render('posts/index', {images: dbRes.rows});
		}
	});
});

// Add new post
app.get('/posts/new', function(req, res)	{
	if(req.user){
	res.render('posts/new')
	} else {
		res.redirect('/')
	}
});
// Show Posts
app.get('/posts/:id', function(req, res)	{
	var user = req.user;
	db.query('SELECT * FROM images WHERE id = $1', [req.params.id], function(err, dbRes)	{
		if(!err) {
			res.render('posts/show', {user: user, images: dbRes.rows[0]});
		}
	});
});

// List of Posts
app.post('/posts', function(req, res)	{
	var params	=	[req.body.imagesource, req.body.location, req.body.title]
	db.query('INSERT INTO images (imagesource, location, title) VALUES ($1, $2, $3)', params, function(err, dbRes){
		if (!err){
			res.redirect('/posts');
		}
	});
});
//Wrong
// New Profile
app.get('/users/signup', function(req, res) {
	console.log(req.user)
	var user = req.user
	res.render('users/signup');
});
// Logout-not restful routing
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/')
});
// Login
app.post('/login',
  passport.authenticate('local', { 
  	successRedirect: '/',
    failureRedirect: '/login'
  })
);
// New User Login
app.post('users/signup', function(req, res){
    db.query("UPDATE users SET name = $1, password = $2 WHERE id = $3", [req.body.name, req.body.password, req.params.id], function(err, dbRes){
        if(err){
            res.redirect('users/signup');
            alert("User Not Signed up!")
          }
     });
});       
// Edit people in table
app.get('/posts/:id/edit', function(req, res)	{
	db.query("SELECT * FROM images WHERE id = $1", [req.params.id], function(err, dbRes){
		if(req.user){
		if (!err) {
			res.render('posts/edit', { images: dbRes.rows[0]});} 
		} else {
		res.redirect('/')
		}
	});
});
// Set edited names to new value
app.patch('/posts/:id', function(req, res)	{
	db.query("UPDATE images SET imagesource = $1, location = $2, title = $3 WHERE id = $4", [req.body.imagesource, req.body.location, req.body.title, req.params.id], function(err, dbRes)	{
		if (!err)	{
			res.redirect('/' + req.params.id);
		}
	});
});
// Delete from table
app.delete('/posts/:id', function(req, res)	{
	db.query("DELETE FROM images WHERE id = $1", [req.params.id], function(err,dbRes)	{
		if (!err)	{
			res.redirect('/posts');
		}
	})
});

//Listen on port 3000
app.listen(4000);
//Inform about setup
console.log('Server is running!')