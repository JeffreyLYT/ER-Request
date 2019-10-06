var mongoose = require('mongoose');

var ErSchema = mongoose.Schema({
    user_id: {
        type: String
    },
    time: {
        type: Date
    },
    areas: {
        type: Array
    },
    vitals: {
        type: Array
    },
    painScale: {
        type: Number
    },
    heart_rate_data: {
        type: String
    },
    sent_to: {
        type: String
    },
    prelim_triage: {
        type: String
    }
});

var Er = module.exports = mongoose.model('Request', ErSchema);

module.exports.getByUser = function (userID, callback) {
    Er.find({ user_id: userID }, callback);
};

module.exports.getByUserLatest = function (userID, callback) {
    Er.findOne({ user_id: userID }, {}, { sort: { 'time': -1 } }, function (err, res) {
        callback(err, res);
    });
};
