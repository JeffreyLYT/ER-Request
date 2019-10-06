var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var router = express.Router();
var User = require('../models/user');

//Register
router.get('/register', function (req, res) {
    if (req.isAuthenticated())
        res.redirect('/');
    else
        res.render('register');
});

//Login
router.get('/login', function (req, res) {
    if (req.isAuthenticated())
        res.redirect('/');
    else
        res.render('login');
});

//Register
router.post('/register', function (req, res) {
    var first_name = req.body.first_name;
    var last_name = req.body.last_name;
    var email = req.body.email;
    var address = req.body.address;
    var sex = req.body.sex;
    var bday = req.body.bday;
    var password = req.body.password;
    var password2 = req.body.password2;
    
    //Validation
    req.checkBody('first_name', 'First name is required').notEmpty();
    req.checkBody('first_name', 'First name is too long (20 characters max)').isLength({ max: 20 });
    req.checkBody('last_name', 'Last name is required').notEmpty();
    req.checkBody('last_name', 'Last name is too long (20 characters max)').isLength({ max: 20 });
    req.checkBody('bday', 'Birth date is not valid').custom(value => {
        if (isNaN(Date.parse(value)))
            return false;
        else
            return true;
    });
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('address', 'Address is required').notEmpty();
    req.checkBody('bday', 'Birth date is not a valid date');
    req.checkBody('password', 'Pasword is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        res.render('register', {
            errors: errors
        });
    } else {
        var newUser = new User({
            first_name: first_name,
            last_name: last_name,
            sex: sex,
            birth_date: Date.parse(bday),
            email: email,
            address: address,
            password: password,
            fitbit_token: '',
            fitbit_profile: '',
            admin: false
        });

        User.getUserByUsername(email, (err, user) => {
            if (user === null)
                User.createUser(newUser, function (err, user) {

                    if (err) throw err;
                    req.flash('success_msg', 'You are registered and can now login');

                    res.redirect('/users/login');
                });
            else {
                req.flash('error_msg', 'Email has already been used');
                res.redirect('/users/register');
            }
            
        });

        

       
    }
});

passport.use(new LocalStrategy(
    function (username, password, done) {
        User.getUserByUsername(username, function (err, user) {
            if (err) throw err;
            if (!user) return done(null, false, { message: 'Unknown user' });

            User.comparePassword(password, user.password, function (err, isMatch) {
                if (err) throw err;
                if (isMatch)
                    return done(null, user);
                else {
                    return done(null, false, { message: 'Invalid password' });
                }
            });
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.getUserById(id, function (err, user) {
        done(err, user);
    });
});

router.post('/login',
    passport.authenticate('local',
        { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
    function (req, res) {
        res.redirect('/');
    }
);

router.get('/logout', function (req, res) {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
});

module.exports = router;