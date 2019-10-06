var express = require('express');
var router = express.Router();
var User = require('../models/user');
var FitbitApiClient = require("fitbit-node");

var fitbit = new FitbitApiClient( 
    {
        clientId: "22D9TT",
        clientSecret: "becb3877984695674cdd29e46f07dff5",
        apiVersion: "1.2"
    });

router.get('/', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error_msg", "You are not logged in");
        res.redirect('/');
    }else if (req.query.code && req.isAuthenticated())
        fitbit.getAccessToken(req.query.code, /*ACTUAL WEBSITE LINK GOES HERE WHEN ITS HOSTED -> */'https://10.202.31.105:3001/fitbit/'
        /* <- IF THIS LINK DOES NOT WORK (AND YOU DON'T HAVE A DOMAIN), USE http://localhost:3000/fitbit/ */).then(result => {
            User.updateOne({ email: req.user.email }, { $set: { fitbit_token: result.access_token } }, function (err, userInDB) {
                fitbit.get('/profile.json', result.access_token).then(results => {
                    User.updateOne({ email: req.user.email }, { $set: { fitbit_profile: results[0]["user"]["fullName"] + " (" + results[0]["user"]["encodedId"] + ")" } }, function (err, userInDB) {
                        req.flash("success_msg", "Successfully linked FitBit account");
                        res.redirect('/');   
                    });
                });
            });
        });
    else {
        req.flash("error_msg", "Could not link fibit account");
        res.redirect('/');
    }
});

router.get('/register', function (req, res) {

    if (req.isAuthenticated()) {
        var fitbitURL = fitbit.getAuthorizeUrl("heartrate profile", /*ACTUAL WEBSITE LINK GOES HERE WHEN ITS HOSTED -> */"https://10.202.31.105:3001/fitbit/" /* <- IF THIS LINK DOES NOT WORK (AND YOU DON'T HAVE A DOMAIN), USE http://localhost:3000/fitbit/ */);
        res.redirect(fitbitURL);
    } else
        res.redirect('/users/login');

});

module.exports = router;