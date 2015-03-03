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

//Serializer
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
// Deserializer
passport.deserializeUser(function(id, done) {
  db.query('SELECT * FROM users WHERE id = $1', [id], function(err, dbRes) {
  	if (!err) {
  		done(err, dbRes.rows[0]);
  	}
	});
});
// Local Strategy
var localStrategy = new LocalStrategy(function(name, password, done) {
  db.query('SELECT * FROM users WHERE name = $1', [name], function(err, dbRes) {
  	var user = dbRes.rows[0];
    
    if (err) { return done(err); }
    if (!user) { 
			return done(null, false, { message: 'Unknown user ' +user }); 
		}
		if (user.password != password) { 
			return done(null, false, { message: 'Invalid password' }); 
		}
		return done(null, user);
		})
	}
)

passport.use(localStrategy);
app.use(passport.initialize());
app.use(passport.session());

////////////////////////////////////////////////////////////
// app.get Routes
app.get('/', function(req, res)	{
	db.query('SELECT * FROM images;', function(err, dbRes) {
		if(!err) {
			res.render('index', {images: dbRes.rows, user: req.user});
		}
	});
});
//Login Page
app.get('/login', function(req, res) {
	res.render('login');
});
// Posts Page
app.get('/posts', function(req, res)	{
	db.query('SELECT * FROM images;', function(err, dbRes) {
		if(req.user){
			if(!err) {
				res.render('posts/index', {images: dbRes.rows});
			}
		} else {
			res.redirect('/')
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
	db.query('SELECT * FROM images WHERE id = $1', [req.params.id], function(err, dbRes)
	{
		if(req.user){
			if(!err) {
				res.render('posts/show', {user: user, images: dbRes.rows[0]});
			}
		} else {
		res.redirect('/')
		}
	});
});

// Edit people in table
app.get('/posts/:id/edit', function(req, res)	{
	db.query("SELECT * FROM images WHERE id = $1", [req.params.id], function(err, dbRes){
		if(req.user){
			if (!err) {
			res.render('posts/edit', { images: dbRes.rows[0]});
			} 
		} else {
		res.redirect('/')
		}
	});
});

// New User
app.get('/users/signup', function(req, res) {
	var user = req.user
	res.render('users/signup');
});
//Show All Images
app.get('/show', function(req, res) {
	db.query('SELECT * FROM images;', function(err, dbRes) {
		res.render('posts/show', { images: dbRes.rows } );
	});
});


app.get('/show', function(req, res) {
  db.query('SELECT * FROM images;', function(err, dbRes) {
	  if(req.user){
		  if(!err) {
		  	console.log(dbRes.rows)
		    res.render('posts/show', {images: dbRes.rows});
			}
		} else {
			res.redirect('/');
		}
	});
});
	

////////////////////////////////////////////////////////////
// app.post Routes
//New Images
app.post('/posts', function(req, res)	{
	var params	=	[req.body.imagesource, req.body.location, req.body.title,req.user.id]
	db.query('INSERT INTO images (imagesource, location, title, users_id) VALUES ($1, $2, $3, $4)', params, function(err, dbRes){
		if (!err){
			res.redirect('/posts');
		}
	});
});

// Login
app.post('/', passport.authenticate('local',
{failureRedirect: '/login'}), function(req, res) {
res.redirect('/');
});

// New User Login
app.post('/users/signup', function(req, res){
	var params	=	[req.body.name, req.body.password]
    db.query("INSERT INTO users (name, password) VALUES ($1, $2)", params, function(err, dbRes){
        if(!err){
            res.redirect('/');
          } else {
          	res.redirect('users/signup')          	
          }
     });
});    

////////////////////////////////////////////////////////////
// app.delete Routes
// Logout
app.delete('/logout', function(req, res) {
	req.logout();
	res.redirect('/')
});

// Delete from table
app.delete('/posts/:id', function(req, res)	{
	db.query("DELETE FROM images WHERE id = $1", [req.params.id], function(err,dbRes)	{
		if (!err)	{
			res.redirect('/posts');
		}
	})
});

////////////////////////////////////////////////////////////
//app.patch Routes
// Set edited names to new value
app.patch('/posts/:id', function(req, res)	{
	db.query("UPDATE images SET imagesource = $1, location = $2, title = $3, WHERE id = $4", [req.body.imagesource, req.body.location, req.body.title, req.params.id], function(err, dbRes)	{
		if (!err)	{
			res.redirect('posts/' + req.params.id);
		}
	});
});


//Listen on port 4000
app.listen(process.env.PORT || 4000);
//Inform about setup
console.log('Server is running!')