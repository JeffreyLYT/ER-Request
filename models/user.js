var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var UserSchema = mongoose.Schema({
    first_name: {
        type: String,
        index: true,
        maxlength: 20
    },
    last_name: {
        type: String,
        maxlength: 20
    },
    sex: {
        type: String,
        maxlength: 1
    },
    birth_date: {
        type: Date
    },
    email: {
        type: String,
        index: true
    },
    address: {
        type: String
    },
    password: {
        type: String
    },
    fitbit_token: {
        type: String
    },
    fitbit_profile: {
        type: String
    },
    admin: {
        type: Boolean
    }
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function (newUser, callback) {
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(newUser.password, salt, function (err, hash) {
            newUser.password = hash;
            newUser.save(callback);
        });
    });
};

module.exports.getUserByUsername = function (email, callback) {
    var query = { email: email };
    User.findOne(query, callback);
};

module.exports.getUserById = function (id, callback) {
    User.findById(id, callback);
};

module.exports.comparePassword = function (candidatePassword, hash, callback) {
    bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
        if (err) throw err;
        callback(null, isMatch);
    });
};

module.exports.getAll = function (callback) {
    User.find({}, callback);
};