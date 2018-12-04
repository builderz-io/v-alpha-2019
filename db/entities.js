var mongoose = require('mongoose');

var entitySchema = mongoose.Schema({
  name: String,
  uPhrase: String,
  role: String,
  status: String,
  expires: Date,
  stats: {
    sendVolume: Number,
    receiveVolume: Number,
    allTimeVolume: Number,
    valueInCirculation: Number,
    valueSubstance: Number,
    verifiedMembers: Number,
    locations: Number,
    pools: Number,
  },
  social: {
    fb: String,
    tw: String,
    web: String,
  },
  token: {
    payout: Number,
    interval: String,
    timeToZero: Number,
    txFee: Number,
    tax: Number,
  },
  profile: {
    name: String,
    role: String,
    status: String,
    karma: Number,
    socketID: String,
    joined: Date,
    lastLogin: Date,
    accessExpires: Date,
    timeZone: String,
  },
  onChain: {
    balance: Number,
    lastMove: Number,
    timeToZero: Number,
  },
  poolData: {
    title: String,
    description: String,
    creator: String,
    created: Date,
    fillUntil: Date,
    expires: Date,
    status: String,
    target: Number,
  },
  requestStats: {
    lastDate: Date,
    lastPool: String,
    lastAmount: Number,
    totalRequested: Number,
  },
  type: {type: String},
  geometry: {
      type: {type: String},
      coordinates: {
          type: [Number],
          index: '2dsphere',
      }
  },
  properties: {
      title: String,
      entry: String,
      location: String,
      fromPrice: String,
      unit: String,
      creator: String,
      status: String,
  },
  contributionData: {
    title: String,
    description: String,
    creator: String,
    created: Date,
    reward: Number,
    unit: String,
    expires: Date,
    status: String,
  }
});

EntityDB = mongoose.model('Entity', entitySchema);

module.exports = EntityDB;
