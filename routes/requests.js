var express = require('express');
var router = express.Router();
var request = require('request');
var publicIP = require('public-ip');

var ER = require('../models/er');

var FitbitApiClient = require("fitbit-node");
var User = require('../models/user');

var fitbit = new FitbitApiClient(
    {
        clientId: "22D9TT",
        clientSecret: "becb3877984695674cdd29e46f07dff5",
        apiVersion: "1.2"
    });

router.get('/', ensureAuthenticated, function (req, res) {
    
    ER.getByUser(req.user._id, function (err, result) {
        //for (var i in result)
        //    result.send_to = JSON.parse(result.send_to);
        res.render('requests', { requests: result });
    });

});

router.get('/new', ensureAuthenticated, function (req, res) {
    
    res.render('requestForm');

});

router.post('/new', ensureAuthenticated, function (req, res) {
    
    var userID = req.user._id;
  
    var areas = new Array();
    var vitals = new Array();
    for (var key in req.body)
        if (key.startsWith('a_'))
            areas.push(key);
        else if(key !== 'painScale')
            vitals.push(key);

    var painScale = req.body.painScale;
    hospitalSearch(req, function (err, hospital) {
        if (err) throw err;
        //var sent_to = JSON.stringify(hospital);
        retrieveHeartRate(req, function (hr) {
            req.checkBody('painScale', 'Pain rating must be a number between 1 and 10').isInt({ lt: 11, gt: 0 });

            var errors = req.validationErrors();

            if (errors) {
                res.render('requestForm', {
                    errors: errors
                });
            } else {
                var newRequest = new ER({
                    user_id: userID,
                    time: Date.now(),
                    areas: areas,
                    vitals: vitals,
                    painScale: painScale,
                    heart_rate_data: hr !== null ? JSON.stringify(hr) : '',
                    sent_to: hospital.name,
                    prelim_triage: (vitals.includes("gash") || vitals.includes("breathing")) ? "VERY URGENT" : (vitals.includes("burn") || vitals.includes("bleeding") || vitals.includes("fracture")) ? "SOMEWHAT URGENT" : "MINOR"
                });
                newRequest.save(function (err, result) {
                    if (err) throw err;
                    req.flash("success_msg", "Sent ER request to hospital : " + hospital.name);
                    res.redirect('/requests/new');
                });
            }
        });
    });
});

module.exports = router;

function hospitalSearch(req, callback) {
    var address = req.connection.remoteAddress.replace(/^.*:/, ''); //Obtain the IP adress of the device
    if (address.startsWith('10.') || address.startsWith('192.168.') || address === '1')
    // Private IP error handling by converting to public IP
    {
        publicIP.v4().then(result => {
            address = result;
            request.get('http://ip-api.com/json/' + address, {}, (err, resp, body) => {
                var location = JSON.parse(body); //Readable form of the body (the info)
                searchNearby(location["lat"], location["lon"], callback);
            });
        });
    }
    else {
        request.get('http://ip-api.com/json/' + address, {}, (err, resp, body) => {
            var location = JSON.parse(body);
            searchNearby(location["lat"], location["lon"], callback);
        });
    }
}

function searchNearby(lat, lon, callback) //Latitude Longitude and Response
{
    //var radius = 5000; //Radius of search in meters
    var type = 'hospital';
    var key = 'AIzaSyAwLyHR42H7qVbdtvMt422jKCyB5Agjdeo'; //Google cloud API Key 
    var keyword = 'hospital';
    request.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + lat + ',' + lon +
        '&rankby=distance&type=' + type + '&keyword=' + keyword + '&key=' + key, {}, (err, resp, body) => {
            var hospitalInfo = JSON.parse(body); //Readable (somewhat) info
            callback(err, hospitalInfo.results[0]); //display it on the webpage
        });
}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error_msg', 'You are not logged in');
        res.redirect('/users/login');
    }
}

function retrieveHeartRate(req, callback) {
    if (req.user.fitbit_token.length > 0)
        fitbit.get("/activities/heart/date/today/1d/1sec.json", req.user.fitbit_token).then(function (results) {
            var arr = results[0]["activities-heart-intraday"]["dataset"];
            callback(JSON.stringify(arr.slice(arr.length - 5), null, "\t")); //send time stamps + HR values of last 5 entries

        }).catch(err => {
            User.updateOne({ email: req.user.email }, { $set: { fitbit_token: '' } }, function (err, updUser) { });
            callback(null);

        });
    else
        callback(null);
}