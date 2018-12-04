// Value Instrument Alpha | Version 0.3.5.0 | Install __ | Apache 2.0 License | https://github.com/valueinstrument/vi-alpha

//*****************    System Init    ********************* //

// Date

const installDate = new Date(Date.now());
const formattedDate = installDate.toDateString() + ' - ' + installDate.toTimeString().slice(0, 5);

// system

const systemInit = require('./systemInit');

const commName = systemInit.communityGovernance.commName;
const daysToZero = systemInit.tokenDyn.daysToZero;
const baseTimeToZero = systemInit.tokenDyn.baseTimeToZero * daysToZero;
const payout = systemInit.tokenDyn.payout;

var express = require('express')
var app = express();
var compression = require('compression');
var minify = require('express-minify');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var mongoose = require('mongoose');

// database

const EntityDB = require('./db/entities');
const TxDB = require('./db/transactions');

(async () => {

  await new Promise((resolve, reject) => {

    mongoose.connect('mongodb://localhost/' + commName.replace(/\s/g, '-'), function (err) {
      if (err) {
          reject();
          console.log(err);
      } else {
        if (!(systemInit.production)) {
          mongoose.connection.db.dropDatabase(function (err) {
            resolve();
            console.log('(' + formattedDate + ') ' + 'Dropped MongoDB ');
            console.log('(' + formattedDate + ') ' + 'Connected to MongoDB ');

          });
        } else {
          resolve();
          console.log('(' + formattedDate + ') ' + 'Kept MongoDB intact');
          console.log('(' + formattedDate + ') ' + 'Connected to MongoDB ');

          /* // Upgrade old version to 0.3.0

          mongoose.connection.db.collection('users').rename('entities', function(err, res) {

            require('./db/dbInit').dbInit();
            require('./public/plugins/map/js/geoDemoContent').geoDemo();  // optionally load demo/testing content
            require('./public/plugins/pool/js/poolDemoContent').poolDemo();  // optionally load demo/testing content


            GeoDB = mongoose.model('Geo', mongoose.Schema({}));

             GeoDB.find({}, { _id: 0 }).exec((err, res) => {
              res.forEach((geoIn) => {

                var geo = geoIn.toObject()

                  var transferGeo = new EntityDB({
                    name: geo.name + "'s offer",
                    type: geo.type,
                    geometry: geo.geometry,
                    properties: geo.properties,
                    role: 'location',
                    status: 'active',
                    uPhrase: 'vlxOfferLogin' + Math.floor((Math.random() * 1000) + 1),
                    stats: {
                      sendVolume: 0,
                      receiveVolume: 0,
                    },
                    profile: {
                      name: geo.name + "'s offer",
                      role: 'location',
                      status: 'active',
                      karma: 10,
                      socketID: 'offline',
                      joined: "2018-11-02T19:33:10.453Z",
                      lastLogin: "2018-11-02T19:33:10.453Z",
                      accessExpires: "2019-03-02T19:33:10.453Z",
                      timeZone: '',
                    },
                    onChain: {
                      balance: 960,
                      lastMove: 1541186428,
                      timeToZero: 10368000,
                    }
                  }).save((err, res) => { err ? console.log(err) : console.log('Transfered Geo to EntityDB');

                    var newTx = new TxDB({
                      name: geo.name + "'s offer",
                      txHistory: {
                        date: "2018-11-02T19:33:10.453Z",
                        from: commName,
                        to: geo.name + "'s offer",
                        for: 'Ignition Balance',
                        burned: 0,
                        tt0: 10368000,
                        credit: 960,
                        chainBalance: 960,
                      }
                    }).save((err, res) => { err ? console.log(err) : console.log('Wrote new Geo balance to TxDB'); });

                  });

                })
              })
            })

          // end Upgrade */

        }
      }
    })
  });

  if (!(systemInit.production)) {
    require('./db/dbInit').dbInit();
    systemInit.geoModule ? require('./public/plugins/map/js/geoDemoContent').geoDemo() : null ;  // optionally load demo/testing content
    systemInit.poolModule ? require('./public/plugins/pool/js/poolDemoContent').poolDemo() : null ;  // optionally load demo/testing content
    systemInit.contributionModule ? require('./public/plugins/contribution/js/qcDemoContent').contributionsDemo() : null ;  // optionally load demo/testing content
  };

  // set all users to offline on start

  EntityDB.find().select('profile').exec((err, res) => {
      res.forEach(res => {
        res.profile.socketID = 'offline';
        res.save();
      })
    });

})() // end async

// app & server

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.use(compression());
app.use(minify());
app.use(express.static(path.join(__dirname, 'public')));


http.listen(3021, 'localhost', function(){
  console.log('(' + formattedDate + ') ' + 'Listening on port 3021');
});


//*****************    Plugins    ********************* //

// Map Module

if (systemInit.geoModule) { require('./public/plugins/map/js/v-alpha-map')(io); } // CRD locations

// Pools Module

if (systemInit.poolModule) { require('./public/plugins/pool/js/v-alpha-pool')(io); }  // CRD pools

// Contributions Module

if (systemInit.contributionModule) { require('./public/plugins/contribution/js/v-alpha-qc')(io); }  // CRD pools


//*****************    Core functionality    ********************* //

require('./functions/message')(io);   // chat message function

require('./functions/transaction')(io);   // transaction function

require('./functions/user-management')(io);   // user management functions

require('./functions/page-content')(io);   // get page content functions

const tools = require('./functions/tools');   // get tool functions


//*****************    Update Visualizations Frequently    ********************* //


setInterval( function () { tools.updateVisualizations(io) }, systemInit.tokenDyn.updateVisFreq * 1000 );



//*****************    Payout    ********************* //


setInterval(payoutEmit, systemInit.tokenDyn.payoutInterval * 1000);

function payoutEmit() {

  EntityDB.find({ role: { $in: ['admin', 'network', 'member' ] } } ).select('-profile').exec()
    .then (res => {
      for (i = 0; i < res.length; i++) {
        var payoutSave = payoutFunction(res[i]);
        payoutSave.save();
      };
    })
    .catch(err => { handleMongoDBerror('Payout', err)} );

  function payoutFunction(user) {
      var timeSecondsUNIX = Number(Math.floor(Date.now() / 1000));
      var burnedRecipientBlocks = timeSecondsUNIX - user.onChain.lastMove;
      var burnedRecipientBalance = Math.ceil(user.onChain.balance - ( user.onChain.balance / (user.onChain.timeToZero / burnedRecipientBlocks)));
      var burnedRecipientDelta = user.onChain.balance - burnedRecipientBalance;
      var newBalance = burnedRecipientBalance + payout;
      var remainingTimeToZero = user.onChain.lastMove + user.onChain.timeToZero - timeSecondsUNIX;
      var newTimeToZero = Math.floor(remainingTimeToZero * (burnedRecipientBalance / newBalance) + baseTimeToZero * ( payout / newBalance ));

      var date = new Date();

      TxDB.findOneAndUpdate(
        {name: user.name},
        { $push: { txHistory: {
          date: date,
          from: commName,
          to: user.name,
          for: systemInit.tokenDynDisplay.payoutTitle,
          burned: burnedRecipientDelta,
          tt0: remainingTimeToZero,
          credit: payout,
          chainBalance: newBalance,
        }}},
        (err) => { if (err) return handleMongoDBerror('Push Payout Tx to DB', err) }
      );

      user.onChain.balance = newBalance;
      user.onChain.lastMove = timeSecondsUNIX;
      user.onChain.timeToZero = newTimeToZero;

      return user
    }
}

function handleMongoDBerror(req, err) {
   console.log('(' + Date.now() + ') ' + 'MongoDB Error - ' + req + ' - ' + err);
}
