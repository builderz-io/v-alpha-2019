// set UBI variables

var baseTimeToZero = 60 * 60 * 24 * 120, // expressed in sec
    ubiInterval = 60 * 60 * 6, // expressed in sec
    initialBalance = 120, // amount V
    ubi = 2,  // amount V
    updateVisFreq = 60 * 5, // expressed in sec
    setTxFee = 0.5 ;// express in decimal number such as 0.5 for 50%

// set production

var production = false;

// system init

var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var d3 = require("d3");
var moment = require('moment');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/vi-alpha', function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'Connected to MongoDB ');
  }
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(path.join(__dirname, 'public')));

http.listen(3021, 'localhost', function(){
  console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'Listening on port 3021');
});

// database init

var msgSchema = mongoose.Schema({
  msg: String,
  sender: String,
  time: Date,
});
var userSchema = mongoose.Schema({
  name: String,
  profile: {
    name: String,
    karma: Number,
    socketID: String,
    joined: Date,
    lastLogin: Date,
  },
  onChain: {
    balance: Number,
    lastMove: Number,
    timeToZero: Number,
  }
});
var txSchema = mongoose.Schema({
    name: String,
    txHistory: [{
      date: Date,
      from: String,
      to: String,
      for: String,
      senderFee: Number,
      burned: Number,
      tt0: Number,
      credit: Number,
      debit: Number,
      spendable: Number,
      chainBalance: Number,
    }]
  });

var ChatDB = mongoose.model('Message', msgSchema);
var UserDB = mongoose.model('User', userSchema);
var TxDB = mongoose.model('Transaction', txSchema);
var RecentTxDB = mongoose.model('Recent', txSchema);

production ? false : ChatDB.remove({}, function(err) {
   console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'ChatDB collection cleared')
});
production ? false : UserDB.remove({}, function(err) {
   console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'UserDB collection cleared')
});
production ? false : TxDB.remove({}, function(err) {
   console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'TxDB collection cleared')
});
production ? false : RecentTxDB.remove({}, function(err) {
   console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'RecentTxDB collection cleared')
});

// set all users to offline on start

UserDB.find().select('profile').exec((err, res) => {
    res.forEach(res => {
      res.profile.socketID = 'offline';
      res.save();
    })
  })

// write a first message into db if empty

ChatDB.estimatedDocumentCount().exec((err, res) => {
    if (res < 1) {
      var firstMsg = new ChatDB({msg: 'This is the start of the value community chat.<br/>And so it begins ...<br/><br/>', sender: 'Value Instrument', time: Date.now() });
      firstMsg.save((err) => { if (err) return handleMongoDBerror('Write first chat message to DB', err) });
    }
})


//*****************    And so it begins ....    ********************* //


io.on('connection', function(socket) {

  socket.on('chat message', function(message) {

    var newMsg = new ChatDB({msg: message, sender: socket.user, time: Date.now()});

    newMsg.save(function(err) {
      if (err) return handleMongoDBerror('Write new chat message to DB', err);

      io.emit('chat message', {msg: message, sender: socket.user, time: Date.now()});
    });
  });

  socket.on('transaction', function(messageParts) {
   UserDB.find().distinct('name')
     .then((registeredUsers) => {

       return txArray(messageParts,registeredUsers)

       function txArray(messageParts, registeredUsers) {
         var recipients = [],
             timeSecondsUNIX = Number(Math.floor(Date.now() / 1000));

         if (messageParts.indexOf('for') != -1) {
           reason = messageParts.slice(messageParts.indexOf('for'),messageParts.length).join(' ');
           messageParts.splice(messageParts.indexOf('for'),messageParts.length - messageParts.indexOf('for'));
         } else {
           reason = ''
         }

         for (i = 0; i < messageParts.length; i++) {
           if (registeredUsers.indexOf(forceNiceLookingName(messageParts[i])) != -1) {
              recipients.push(forceNiceLookingName(messageParts[i]));
           } else {
             var triggers = ['+', 'pay', 'send', 'plus', 'sned', 'help', 'nukeme'];
             (messageParts[i] === String && triggers.indexOf(messageParts[i]) === -1) ? errorTx('Can not send amount to ' + messageParts[i] + '. ' + messageParts[i] + 'may not be a registered member or you made a typing error.') : false;
           };
         };

         var filteredNumbers = messageParts.filter(function (item) { return Number(parseInt(item) == item); }),
                      amount = filteredNumbers.reduce(function(acc, val) { return Number(acc) + Number(val); }, 0);

         return amount <= 0 ? errorTx('Invalid amount') :
          recipients.length < 1 ? errorTx('No community member entered') :
          recipients.indexOf(socket.user) != -1 ? errorTx('You can not send <span class="v">V</span> to yourself') :
         [amount, forceNiceLookingName(socket.user), recipients, reason, timeSecondsUNIX]

        function errorTx(error) {
         socket.emit('chat notification', { msg :'<span class="red-text">' + error + '</span>', symbol: '&#9673;' });
         throw new Error(error);
        }
       }

       function forceNiceLookingName(input) {
         var string = input.replace(/[^A-Za-z]+/g, '').trim().toLowerCase();
         return string.charAt(0).toUpperCase() + string.slice(1);
       }

     })
     .then((txArray) => {

       return Promise.all([
         txArray,
         UserDB.find({name: txArray[1]}).select('onChain') // using this like a ping to db
       ]);

     })
     .then((results) => {
       //  console.log(JSON.stringify(results));

       return Promise.all([
         results[0],
         results[1],
         checkSenderBalance(results[0], results[1][0].onChain),
       ]);

       function checkSenderBalance(txArray, onChain) {
         var txFee = txArray[0] & 1 == 1 ? Math.ceil(txArray[0] * setTxFee) : Math.floor(txArray[0] * setTxFee); // i & 1 == 1 ? checks first bit
         var burnedSenderBlocks = txArray[4] - onChain.lastMove;
         var burnedSenderBalance = Math.ceil(onChain.balance - ( onChain.balance / (onChain.timeToZero / burnedSenderBlocks)));

         for (i = 0; i < txArray[2].length; i++) {     // loop through recipients
           burnedSenderBalance -= txArray[0] + txFee;
         }

         if (burnedSenderBalance <= 0) {
           var error = txArray[0] > 9999 ? 'You wish... unfortunately you\'re still missing ' + (txArray[0] - burnedSenderBalance) + ' <span class="v">V</span> to make such large transaction. How about offering something great to the <span class="v">V </span> Community? We never say never!' : 'Not enough balance to send ' + txArray[0] + ' <span class="v">V</span>';

           socket.emit('chat notification', { msg :'<span class="red-text">' + error + '</span>', symbol: '&#9673;' });
           throw new Error(error);
         } else {return true};

       }

     })
     .then((results2) => {
       //  console.log(JSON.stringify(results2));
       /* results2 is an array like this:
           [
            txArray at Index[0] --> e.g. [20,"d",["a","m"],"for chocolate and beer",1534494241,true],
            sender onChain data at Index[1] --> e.g. [{"onChain":{"balance":240,"lastMove":1534523156,"timeToZero":120},"_id":"5b76f714f37bdd5a0489e90b"}],
            balanceCheck at Index[2] --> 'true'
           ]
       */

       return Promise.all([
         results2[0],
         updateSender(results2[0], results2[1]),
         UserDB.find({name: {$in: results2[0][2] }}).select('name onChain')
       ]);

       function updateSender(txArray, senderAccount) {

         var senderAcc = senderAccount[0].onChain;

         var txFee = txArray[0] & 1 == 1 ? Math.ceil(txArray[0] * setTxFee) : Math.floor(txArray[0] * setTxFee); // i & 1 == 1 ? checks first bit
         var burnedSenderBlocks = txArray[4] - senderAcc.lastMove;
         var burnedSenderBalance = Math.ceil(senderAcc.balance - ( senderAcc.balance / (senderAcc.timeToZero / burnedSenderBlocks)));
         var burnedSenderDelta = senderAcc.balance - burnedSenderBalance;
         var remainingTimeToZeroSender = senderAcc.lastMove + senderAcc.timeToZero - txArray[4]; // in sender's case it's just the remaining time to zero

         var newTotalBalance = burnedSenderBalance - ((txArray[0] + txFee) * txArray[2].length);

         UserDB.findOne({name: txArray[1] }).select('onChain').exec( (err, res) => {
           res.onChain.balance = newTotalBalance;
           res.onChain.lastMove = txArray[4];
           res.onChain.timeToZero = remainingTimeToZeroSender;
           res.save((err) => {
             if (err) {return handleMongoDBerror('Update Recipient OnChain Data after transaction', err)};
             updateUserAccountData([txArray[1]]);
           });
         });

         for (i = 0; i < txArray[2].length; i++) {

           var chainBalance = burnedSenderBalance - ((txArray[0] + txFee) * (i + 1));
           var burned;

           i > 0 ? burned = 0 : burned = burnedSenderDelta;

           TxDB.findOneAndUpdate(
             {name: txArray[1]},
             { $push: { txHistory: {
               date: Date.now(),
               from: txArray[1],
               to: txArray[2][i],
               for: txArray[3].replace(/for\s/,''),
               senderFee: txFee,
               burned: burned,
               tt0: remainingTimeToZeroSender,
               credit: 0,
               debit: txArray[0],
               spendable: Math.floor(chainBalance / (1 + setTxFee) ),
               chainBalance: chainBalance,
             }}},
             (err) => { if (err) return handleMongoDBerror('Push Sender-Tx to Database', err)}
           );
         } // close for-loop
       } // close updateSender function

       function handleMongoDBerror(req, err) {
          console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'MongoDB Error - ' + req + ' - ' + err);
       }

     })
     .then((results3) => {
        // console.log(JSON.stringify(results3));
       /* results3 is an array like this:
         [
           txArray at Index[0] --> e.g. [20,"d",["a","c"],"for chocolate and beer",1534527251],
           senderUpdated success at Index[1] --> e.g. {"n":1,"nModified":1,"ok":1},
           recipients onChain data at Index[2] --> e.g. [{"onChain":{"balance":240,"lastMove":1534527224,"timeToZero":120},"_id":"5b7706f8bfc9e55da3d0695f","name":"a"},
                                                         {"onChain":{"balance":240,"lastMove":1534527232,"timeToZero":120},"_id":"5b770700bfc9e55da3d06965","name":"c"}
                                                        ],
           sender data for txHistory at Index[3] --> e.g. [10,0,105,63]
         ]
       */

        return Promise.all([
          results3[0],
          updateRecipient(results3)
        ]);

        function updateRecipient(results3) {

            var txArray = results3[0];

            for (i = 0; i < results3[2].length; i++) {

              var recipientAcc = results3[2][i].onChain;
              var burnedRecipientBlocks = txArray[4] - recipientAcc.lastMove;
              var burnedRecipientBalance = Math.ceil(recipientAcc.balance - ( recipientAcc.balance / (recipientAcc.timeToZero / burnedRecipientBlocks)));
              var burnedRecipientDelta = recipientAcc.balance - burnedRecipientBalance;
              var newBalance = burnedRecipientBalance + txArray[0];
              var remainingTimeToZero = recipientAcc.lastMove + recipientAcc.timeToZero - txArray[4];
              var newTimeToZero = Math.ceil(remainingTimeToZero * (burnedRecipientBalance / newBalance) + baseTimeToZero * ( txArray[0] / newBalance ));

              var name = results3[2][i].name;

              UserDB.findOneAndUpdate(
                {name: name },
                { onChain: {
                  balance: newBalance,
                  lastMove: txArray[4],
                  timeToZero: newTimeToZero,
                }},
                (err) => {
                  if (err) {return handleMongoDBerror('Push Recipient-Tx to Database', err)};
                  updateUserAccountData([name]);
                }
              );

              TxDB.findOneAndUpdate(
                {name: name },
                { $push: { txHistory: {
                  date: Date.now(),
                  from: txArray[1],
                  to: name,
                  for: txArray[3].replace(/for\s/,''),
                  senderFee: 0,
                  burned: burnedRecipientDelta,
                  tt0: newTimeToZero,
                  credit: txArray[0],
                  debit: 0,
                  spendable: Math.floor(newBalance / (1 + setTxFee)),
                  chainBalance: newBalance,
                }}},
                (err) => { if (err) return handleMongoDBerror('Push Recipient-Tx to Database', err)}
              );

              RecentTxDB.findOneAndUpdate(
                {name: name },
                { $push: { txHistory: {
                  date: Date.now(),
                  from: txArray[1],
                  to: name,
                  for: txArray[3].replace(/for\s/,''),
                  senderFee: 0,
                  burned: burnedRecipientDelta,
                  tt0: newTimeToZero,
                  credit: txArray[0],
                  debit: 0,
                  spendable: Math.floor(newBalance / (1 + setTxFee)),
                  chainBalance: newBalance,
                }}},
                (err) => { if (err) return handleMongoDBerror('Push Recipient-Tx to Database', err)}
              );
            } // close for-loop
        } // close updateRecipient function

        function handleMongoDBerror(req, err) {
           console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'MongoDB Error - ' + req + ' - ' + err);
        }

     })
     .then((results4) => {
        // console.log(JSON.stringify(results4));

        //  finally send notifications to sender and recipient

       var txArray = results4[0];

       for (i = 0; i < txArray[2].length; i++) {

         UserDB.findOne({name: txArray[2][i]}).select('profile').exec((err, res) => {

           socket.broadcast.to(res.profile.socketID).emit('chat notification', { msg: '<span class="green-text">You received <span class="straight-number">' + txArray[0] + '</span> <span class="v">V</span> from ' + txArray[1] + ' ' + txArray[3] + '</span>', symbol: '&#9673;' });
           socket.broadcast.to(res.profile.socketID).emit('transaction received');
           //  socket.broadcast.to(res.profile.socketID).emit('burn info message', {msg: '<span class="time">+ '+ burnedRecipientDelta + ' <span class="v">V</span> were burned since your account has last been active.</span>', user: '&#9752;'});

         })

         socket.emit('chat notification', { msg: '<span class="green-text">You sent <span class="straight-number">' + txArray[0] + '</span> <span class="v">V</span> out to ' + txArray[2][i] + ' ' + txArray[3] + '</span>', symbol: '&#9673;' }); // <br/><span class="time">+ ' + txFee + ' <span class="v">V</span> were burned with this transaction.</span>
         //  if (i === txArray[2].length - 1) { socket.emit('burn info message', {msg: '<span class="time">+ '+ burnedSenderDelta + ' <span class="v">V</span> were burned since your account has last been active.</span>', user: '&#9752;'}); };
       }

     })
     .catch((err) => {
       console.log('Issue handling transaction - ' + err);
     });

   function regUsers() {
       return UserDB.find().distinct('name');
   };
  });

  socket.on('tx history', function() {

    TxDB.find({name: socket.user}, { txHistory: { $slice: [ -100, 100 ] } }).exec(function(err, docs) {
                  if (err) return handleMongoDBerror('Get TX History from DB', err);
                  socket.emit('tx history', docs);
                  })
  });

  socket.on('returning user', function(user, callback) {

    UserDB.find().distinct('name')
      .then((userList) => {
        if (userList.indexOf(user) != -1) {
          socket.user = user;
          sendMessageHistory(user, true );
          updateUserAccountData([user]);
          socket.emit('name in header', socket.user );

          UserDB.findOne({ name: user }, function (err, doc) {
            doc.profile.lastLogin = Date.now();
            doc.profile.socketID = String(socket.id);
            doc.save((err) => {
              if (err) {return handleMongoDBerror('Save Returning User to DB', err) };
              updateUserOnlineList();
              updateUserAccountData([user]);
            });
          });

          return callback(true);

        } else {
          return callback(false);
        }
      })
      .catch((err) => {
        console.log('Issue with returning user - ' + err);

      });

  });

  socket.on('new user', function(user, callback) {

    UserDB.find().distinct('name')
        .then((userList) => {

            if (userList.indexOf(user) != -1 || user.length > 12 || user.length < 2) {
                throw new Error('Username taken or void')
            } else {
                var date = Date.now();
                socket.user = user;
                var newUser = new UserDB({
                  name: user,
                  profile: {
                    joined: date,
                    lastLogin: date,
                    name: user,
                    karma: 10,
                    socketID: String(socket.id),
                  },
                  onChain: {
                    balance: initialBalance,
                    lastMove: Number(Math.floor(date / 1000)),
                    timeToZero: baseTimeToZero,
                  }
                });
                var newTx = new TxDB({
                  name: user,
                  txHistory: {
                    date: date,
                    from: 'Value',
                    to: user,
                    for: 'Welcome Balance',
                    senderFee: 0,
                    burned: 0,
                    tt0: baseTimeToZero,
                    credit: initialBalance,
                    debit: 0,
                    spendable: Math.floor(initialBalance / (1 + setTxFee)),
                    chainBalance: initialBalance,
                  }
                });
                var newRecentTx = new RecentTxDB({
                  name: user,
                  txHistory: {
                    date: date,
                    from: 'Value',
                    to: user,
                    for: 'Welcome Balance',
                    senderFee: 0,
                    burned: 0,
                    tt0: baseTimeToZero,
                    credit: initialBalance,
                    debit: 0,
                    spendable: Math.floor(initialBalance / (1 + setTxFee)),
                    chainBalance: initialBalance,
                  }
                });

                newUser.save((err) => {
                  if (err) {return handleMongoDBerror('Save New User to DB', err) };
                  updateUserOnlineList();
                  // updateUserAccountData([user]);
                  animateSpendable();
                }),
                newTx.save((err) => { if (err) return handleMongoDBerror('Save Welcome Balance to DB', err) }),
                newRecentTx.save((err) => { if (err) return handleMongoDBerror('Save Welcome Balance to Recent DB', err) })

                sendMessageHistory(user , false );

                socket.emit('name in header', socket.user );

                console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + user + ' registered and added to list');

                return callback(true);
            };

        })
        .catch((err) => {
          callback(false)
          console.log('Issue with new user signup - ' + err);

        })


  });

  socket.on('disconnect', function() {
    if(!socket.user) return;

    UserDB.findOne({ name: socket.user }, function (err, doc) {
      doc.profile.socketID = 'offline';
      doc.save((err) => {
        if (err) {return handleMongoDBerror('Set User to offline in DB', err) };
        updateUserOnlineList();
      });
    });
  });

  socket.on('nukeme', function() {
    RecentTxDB.findOneAndRemove({name: socket.user}).exec();
    TxDB.findOneAndRemove({name: socket.user}).exec();
    UserDB.findOneAndRemove({name: socket.user}).exec((err) => {
          if (err) {return handleMongoDBerror('Nuke User in DB', err) };
          updateUserOnlineList();
        })

    delete socket.user;
    socket.emit('nukeme');
  });


  function sendMessageHistory(user, retUser) {

    ChatDB.find({}).sort('-time').limit(100).exec(function(err, docs) {
                  if (err) return handleMongoDBerror('Get Message History from DB', err);
                  socket.emit('chat history', docs.sort('time'), function(callback) {
                    callback && retUser === true ? welcomeBack(user) : welcomeNew(user);
                  });

               });
  }

  function welcomeBack(user) {
    socket.emit('chat notification', { msg: socket.user + ' - Welcome back to <span class="v">V</span><br/>Remember to enter "help" for help.', symbol: '&#9673;' });
    var recentCredits = constructRecentCredits(user);
  }

  function welcomeNew(user) {
    socket.emit('chat notification', { msg: user + ' - Welcome to <span class="v">V</span>', symbol: '&#9673;' });
    socket.emit('chat notification', { msg: 'Enter "help" at any time to learn about transferring Value to others.', symbol: '&#9673;' });
    socket.emit('chat notification', { msg: 'Note that you are experimenting with an alpha test version. Your messages and transactions may be deleted without warning.', symbol: '&#9673;' });
    socket.emit('chat notification', { msg: 'We recommend using Firefox as browser.', symbol: '&#9673;' });

  }

  function constructRecentCredits(user) {

    return RecentTxDB.find({name: user}).exec(function(err, docs) {
                    if (err) return handleMongoDBerror('Get Message History from DB', err);

                    var recentCredits = '';

                    for (i = docs[0].txHistory.length, c = 0; i-- > 0, c < 3;) {

                      if (i >= 0 ) {
                        var tx = docs[0].txHistory[i];
                        recentCredits += '<span class="green-text"><span class="straight-number">' + tx.credit + '</span> <span class="v">V</span> &nbsp;by ' + tx.from + (tx.for != '' ? (' for ' + tx.for) : '') + ' - received ' + moment(tx.date).from() + '</span><br/>';
                        c++;
                      } else { break }
                    };

                    socket.emit('chat notification', { msg: 'Community members recently sent you ...<br/><br/>' + recentCredits, symbol: '&#9673;' });

                    return;

                 });

  }

  function updateUserOnlineList() {

    UserDB.find({}).select('profile').exec(function(err, res) {
                  if (err) return handleMongoDBerror('Run updateUserOnlineList from DB', err);

                  function compare(a,b) {
                    if (a.profile.name < b.profile.name)
                      return -1;
                    if (a.profile.name > b.profile.name)
                      return 1;
                    return 0;
                  }

                  res.sort(compare);

                  var online = '',  // '<li class="member-list">Person 1 <i class="fas fa-user online-user"></i></li><li class="member-list">Person 2 <i class="fas fa-user online-user"></i></li><li class="member-list">Person 3 <i class="fas fa-user online-user"></i></li>',
                      offline = '' ;  // '<li class="member-list">Person 4 </li><li class="member-list">Person 5 </li><li class="member-list">Person 6 </li>',

                      for (i = 0; i < res.length; i++) {
                        if ( res[i].profile.socketID != 'offline' ) {
                          online += '<li class="member-list">' + res[i].profile.name + ' <i class="fas fa-user online-user"></i></li>';
                        } else {
                          offline += '<li class="member-list">' + res[i].profile.name + '</li>';
                        }

                      }
                      io.sockets.emit('user online list', online + offline);

               });
  }

  function updateUserAccountData(userArray) {
     // console.log('Array to update is: ' + JSON.stringify(userArray));

     for (i = 0; i < userArray.length; i++) {

       UserDB.findOne({name: userArray[i]}).exec(function(err, res) {
         if (err) return handleMongoDBerror('Run updateUserAccountData from DB', err);

           var userAcc = res.onChain;
               snapTimeStamp = Math.floor(Date.now() / 1000),
               remainingTimeToZero = userAcc.lastMove + userAcc.timeToZero - snapTimeStamp,
               burnedUserBalance = Math.ceil(userAcc.balance - ( userAcc.balance / (userAcc.timeToZero / ( snapTimeStamp - userAcc.lastMove )))),
               spendable = Math.floor(burnedUserBalance / (1 + setTxFee));


           res.profile.socketID != 'offline' ?
                  io.sockets.connected[res.profile.socketID].emit('user account data', { 'spendable': spendable, 'rt0': Math.floor(remainingTimeToZero/60/60/24), 'balance': userAcc.balance, 'at0': Math.floor(userAcc.timeToZero/60/60/24) } ) : false;

       });
     }
  }

  function handleMongoDBerror(req, err) {
     console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'MongoDB Error - ' + req + ' - ' + err);
  }

  var aniLoop = 1, aniEnd = (initialBalance / (1 + setTxFee))/2;

  function animateSpendable () {
     setTimeout(function () {
       socket.emit('user account data', { 'spendable': aniLoop * 2, 'rt0': baseTimeToZero/60/60/24 - aniEnd + aniLoop, 'balance': initialBalance, 'at0': baseTimeToZero/60/60/24 } );
        aniLoop++;
        if (aniLoop < aniEnd + 1) {
           animateSpendable();
        }
     }, aniLoop * 170)
  }


}); // end io.on('connection')


//*****************    Update Visualizations Frequently    ********************* //


setInterval(updateVisualizationsF, updateVisFreq * 1000);

function updateVisualizationsF() {

  UserDB.find({}).exec(function(err, res) {
      if (err) return handleMongoDBerror('Run updateVisualizationsF from DB', err);

      for (i = 0; i < res.length; i++) {

        var userAcc = res[i].onChain;
            snapTimeStamp = Math.floor(Date.now() / 1000),
            remainingTimeToZero = userAcc.lastMove + userAcc.timeToZero - snapTimeStamp,
            burnedUserBalance = Math.ceil(userAcc.balance - ( userAcc.balance / (userAcc.timeToZero / ( snapTimeStamp - userAcc.lastMove )))),
            spendable = Math.floor(burnedUserBalance / (1 + setTxFee));


        res[i].profile.socketID != 'offline' ?
               io.sockets.connected[res[i].profile.socketID].emit('user account data', { 'spendable': spendable, 'rt0': Math.floor(remainingTimeToZero/60/60/24), 'balance': userAcc.balance, 'at0': Math.floor(userAcc.timeToZero/60/60/24) } ) : false;
      }
   });
}


//*****************    Increasing UBI Balance    ********************* //


setInterval(ubiEmit, ubiInterval * 1000);

function ubiEmit() {

  UserDB.find().select('-profile').exec()
    .then (res => {
      for (i = 0; i < res.length; i++) {
        var UBIpayout = payoutUBI(res[i]);
        UBIpayout.save();
      };
    })
    .catch(err => { handleMongoDBerror('Payout UBI', err)} );

  function payoutUBI(user) {
      var timeSecondsUNIX = Number(Math.floor(Date.now() / 1000));
      var burnedRecipientBlocks = timeSecondsUNIX - user.onChain.lastMove;
      var burnedRecipientBalance = Math.ceil(user.onChain.balance - ( user.onChain.balance / (user.onChain.timeToZero / burnedRecipientBlocks)));
      var burnedRecipientDelta = user.onChain.balance - burnedRecipientBalance;
      var newBalance = burnedRecipientBalance + ubi;
      var remainingTimeToZero = user.onChain.lastMove + user.onChain.timeToZero - timeSecondsUNIX;
      var newTimeToZero = Math.floor(remainingTimeToZero * (burnedRecipientBalance / newBalance) + baseTimeToZero * ( ubi / newBalance ));

      TxDB.findOneAndUpdate(
        {name: user.name},
        { $push: { txHistory: {
          date: Date.now(),
          from: 'Value',
          to: user.name,
          for: 'Basic Income',
          senderFee: 0,
          burned: burnedRecipientDelta,
          tt0: remainingTimeToZero,
          credit: ubi,
          debit: 0,
          spendable: Math.floor(newBalance / (1 + setTxFee)),
          chainBalance: newBalance,
        }}},
        (err) => { if (err) return handleMongoDBerror('Push UBI Tx to DB', err) }
      );

      user.onChain.balance = newBalance;
      user.onChain.lastMove = timeSecondsUNIX;
      user.onChain.timeToZero = newTimeToZero;

      return user
    }
}



function handleMongoDBerror(req, err) {
   console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'MongoDB Error - ' + req + ' - ' + err);
}


// the end ...
