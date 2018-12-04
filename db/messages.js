var mongoose = require('mongoose');

var msgSchema = mongoose.Schema({
  msg: String,
  sender: String,
  time: Date,
});

var ChatDB = mongoose.model('Message', msgSchema);

module.exports = ChatDB;
