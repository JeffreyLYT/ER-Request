var express = require('express');
var router = express.Router();

var User = require('../models/user');
var ER = require('../models/er');

//Get Homepage
router.get('/', ensureAuthenticated, function (req, res) {
    ER.getByUserLatest(req.user._id, function (err, result) {
        if (err) throw err;

        res.render('index', { user: req.user, last: result});
    });
});

router.get('/userDB', isAdmin, function (req, res) {

    User.getAll(function (err, users) {
        if (!err) {
            res.render('userDB', { users: users });
        } else
            throw err;
    });

});

router.post('/updateUsers', isAdmin, function (req, res) {

    var userCount = req.body.userCount;

    var users = new Array(userCount);
    var admin = new Array(userCount);
    for (var i = userCount - 1; i >= 0; i--)
        admin[i] = false;

    for (var key in req.body) {
        if (key.includes("username")) {
            users[key.split("username")[1]] = req.body[key];
        } else if (key.includes("admin")) {
            admin[key.split("admin")[1]] = true;
        }
    }

    var userAdmins = [];
    var regularUsers = [];

    for (i = 0; i < userCount; i++) {
        if (admin[i])
            userAdmins.push(users[i]);
        else
            regularUsers.push(users[i]);
    }

    User.updateMany({ email: { $in: userAdmins } }, { $set: { admin: true } }, function (err, result) {
        if (err)
            throw err;
        else
            User.updateMany({ email: { $in: regularUsers } }, { $set: { admin: false } }, function (err, result) {
                if (err)
                    throw err;
                else {
                    req.flash('success_msg', 'Succesfully updated users');
                    res.redirect('/userDB');
                }
            });
    });

});



function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
       //req.flash('error_msg', 'You are not logged in');
        res.redirect('/users/login');
    }
}

function isAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.admin === true)
            return next();
        else {
            req.flash('error_msg', 'You are not an admin');
            res.redirect('/');
        }
    } else {
        req.flash('error_msg', 'You are not logged in');
        res.redirect('/users/login');
    }
}

module.exports = router;