// Value Instrument Alpha | Version 0.3.6.0 | Apache 2.0 License | https://github.com/valueinstrument/vi-alpha

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

const express = require('express');
const app = express();
const compression = require('compression');
const minify = require('express-minify');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const mongoose = require('mongoose');

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

            if (err) {
              console.log(err);
              reject();
            }

            require('./functions/database-initialization').dbInit();
            systemInit.geoModule ? require('./public/plugins/map/js/geoDemoContent').geoDemo() : null ;  // optionally load demo/testing content
            systemInit.poolModule ? require('./public/plugins/pool/js/poolDemoContent').poolDemo() : null ;  // optionally load demo/testing content
            systemInit.contributionModule ? require('./public/plugins/contribution/js/qcDemoContent').contributionDemo() : null ;  // optionally load demo/testing content

            resolve();
            console.log('(' + formattedDate + ') ' + 'Dropped MongoDB ');
            console.log('(' + formattedDate + ') ' + 'Connected to MongoDB ');

          });
        } else {
          resolve();
          console.log('(' + formattedDate + ') ' + 'Kept MongoDB intact');
          console.log('(' + formattedDate + ') ' + 'Connected to MongoDB ');

        }
      }
    });
  });

  // set all users to offline on start

  EntityDB.find().select('profile').exec((err, res) => {
    res.forEach(res => {
      res.profile.socketID = 'offline';
      res.save();
    });
  });


})(); // end async

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


setInterval( function () { tools.updateVisualizations(io); }, systemInit.tokenDyn.updateVisFreq * 1000 );



//*****************    Payout    ********************* //


setInterval(payoutEmit, systemInit.tokenDyn.payoutInterval * 1000);

function payoutEmit() {

  EntityDB.find({ role: { $in: ['admin', 'network', 'member' ] } } ).select('-profile').exec()
    .then (res => {
      for (let i = 0; i < res.length; i++) {
        let payoutSave = payoutFunction(res[i]);
        payoutSave.save();
      }
    })
    .catch(err => { handleMongoDBerror('Payout', err);} );

  function payoutFunction(user) {
    const timeSecondsUNIX = Number(Math.floor(Date.now() / 1000));
    const burnedRecipientBlocks = timeSecondsUNIX - user.onChain.lastMove;
    const burnedRecipientBalance = Math.ceil(user.onChain.balance - ( user.onChain.balance / (user.onChain.timeToZero / burnedRecipientBlocks)));
    const burnedRecipientDelta = user.onChain.balance - burnedRecipientBalance;
    const newBalance = burnedRecipientBalance + payout;
    const remainingTimeToZero = user.onChain.lastMove + user.onChain.timeToZero - timeSecondsUNIX;
    const newTimeToZero = Math.floor(remainingTimeToZero * (burnedRecipientBalance / newBalance) + baseTimeToZero * ( payout / newBalance ));

    const date = new Date();

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
      (err) => { if (err) return handleMongoDBerror('Push Payout Tx to DB', err); }
    );

    user.onChain.balance = newBalance;
    user.onChain.lastMove = timeSecondsUNIX;
    user.onChain.timeToZero = newTimeToZero;

    return user;
  }
}

function handleMongoDBerror(req, err) {
  console.log('(' + Date.now() + ') ' + 'MongoDB Error - ' + req + ' - ' + err);
}
