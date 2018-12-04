var mongoose = require('mongoose');

var txSchema = mongoose.Schema({
    name: String,
    txHistory: [{
      date: Date,
      initiator: String,
      from: String,
      to: String,
      for: String,
      senderFee: Number,
      burned: Number,
      tt0: Number,
      credit: Number,
      debit: Number,
      chainBalance: Number,
    }]
  });

var TxDB = mongoose.model('Transaction', txSchema);

module.exports = TxDB;
