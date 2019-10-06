var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/local', { useNewUrlParser: true });
var db = mongoose.connection;

var users = require('./routes/users');
var index = require('./routes/index');
var er = require('./routes/requests');
var fitbit = require('./routes/fitbit');

var fs = require('fs');

var privateKey = fs.readFileSync('./sslcert/erequest.key');
var certificate = fs.readFileSync('./sslcert/erequest.cert');
var credentials = { key: privateKey, cert: certificate };
var http = require('http');
var https = require('https');

//Init App
var app = express();

//View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({ defaultLayout: 'layout' }));
app.set('view engine', 'handlebars');

//Handlebars Helper function
exphbs.create({
    helpers: {
        IsEqual: function (v1, v2, options) {
            if (v1 === v2)
                options.fn(this);
            else
                options.inverse(this);
        }
    }
});

var hbs = exphbs.create({
    // Specify helpers which are only registered on this instance.
    helpers: {
        IsEqual: function (v1, v2, options) {
            if (v1 === v2)
                options.fn(this);
            else
                options.inverse(this);
        }
    }
});



//BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

//Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

//Passport init
app.use(passport.initialize());
app.use(passport.session());

//Express Validator
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
            , root = namespace.shift()
            , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));

//Connect Flash
app.use(flash());

//Global Vars
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

app.use('/users', users);
app.use('/requests', er);
app.use('/fitbit', fitbit);
app.use('/', index);


//Set Port and Start Server
app.set('port', process.env.PORT || 3000);
app.set('ports', process.env.PORT + 1 || 3001);

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(app.get('port'));
httpsServer.listen(app.get('ports'));

console.log('HTTP Server started on port ' + app.get('port'));
console.log('HTTPS Server started on port ' + app.get('ports'));

