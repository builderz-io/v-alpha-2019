exports = module.exports = function(io) {

  const EntityDB = require('../db/entities');
  const TxDB = require('../db/transactions');

  const moment = require('moment');
  const forceNiceLookingName = require('./tools.js').forceNiceLookingName;

  const systemInit = require('../systemInit');
  const i18n = require('../lang/' + systemInit.language);

  const daysToZero = systemInit.tokenDyn.daysToZero;
  const baseTimeToZero = systemInit.tokenDyn.baseTimeToZero * daysToZero;
  const setTxFee = systemInit.tokenDyn.setTxFee;
  const taxPool = systemInit.taxPool;
  const requestLimit = systemInit.poolGovernance.maxRequest;


  io.sockets.on('connection', function (socket) {

    socket.on('transaction', function(messageParts) {

     var request = false,
        transfer = false,
       initiator = forceNiceLookingName(socket.user),
            date = Date.now(),
       reference = '',
          reason = '';

     EntityDB.find().distinct('name')
       .then((registeredUsers) => {  // console.log('Then 1');


         return Promise.all([
           txArray(messageParts,registeredUsers),
         ]);

         async function txArray(messageParts, registeredUsers) {
           var recipients = [],
               sender = '',
               timeSecondsUNIX = Number(Math.floor(date / 1000)),
               forIndex = messageParts.indexOf(i18n.str50010);

           if (forIndex != -1) {
             getReason = messageParts.slice(forIndex + 1 , messageParts.length).join(' ');
             reason = getReason.charAt(0).toUpperCase() + getReason.slice(1);
             messageParts.splice(forIndex , messageParts.length - forIndex);
             reference = i18n.str50010 + ' ' + reason;
           } else {
             reason = ''
           }

           sender = forceNiceLookingName(socket.user);

           for (i = 0; i < messageParts.length; i++) {
             if (registeredUsers.indexOf(forceNiceLookingName(messageParts[i])) != -1) {
                recipients.push(forceNiceLookingName(messageParts[i]));
             };
           };

           var filteredNumbers = messageParts.filter(function (item) { return Number(parseInt(item) == item); }),
                        amount = filteredNumbers.reduce(function(acc, val) { return Number(acc) + Number(val); }, 0),
                        exp = moment(socket.accessExpires);

           const checkRequest = async () => {

              const a = new Promise((resolve) => {
                EntityDB.findOne({name: sender}).exec( (err, res) => { // {$and: [{name: sender}, {name: recipients[0]}]}
                  resolve(res);
                });
              });

              const b = new Promise((resolve) => {
                EntityDB.findOne({name: recipients[0]}).exec( (err, res) => { // {$and: [{name: sender}, {name: recipients[0]}]}
                  resolve(res);
                });
              });

              return await Promise.all([ a, b ]);

           };


           if (messageParts[0] === i18n.str50020 || messageParts[0] === '-') {

             // flip sender and recipient in case of user requesting funds

             request = true;

                 sender = recipients[0];
                 recipients = [forceNiceLookingName(socket.user)];

             return checkRequest().then((ab) => { return checknreturnTx(ab); })

           } else if (messageParts[0] === i18n.str50030 || messageParts[0] === 't') {

             // transfer

             transfer = true;

             var upper = messageParts.map(string => string.charAt(0).toUpperCase() + string.slice(1));

             const setupTransfer = async () => {

               const a = await new Promise((resolve) => {
                 EntityDB.find({name: {$in: upper} }).exec( (err, res) => {

                   var senderObj = '',
                       recipientObjs = [];

                   recipients = [];

                   for (i=0;i < res.length;i++) {
                     if (['pool','contribution'].indexOf(res[i].role) != -1) {
                       sender = res[i].name;
                       senderObj = res[i];

                     }
                     if (['member', 'admin'].indexOf(res[i].role) != -1) {
                       recipients.push(res[i].name);
                       recipientObjs.push(res[i]);
                     }
                   }

                   resolve([senderObj, recipientObjs]);
                 });
               });

               return a;

             };

             return setupTransfer().then((ab) => { return checknreturnTx(ab); })

           } else {

             return checkRequest().then((ab) => { return checknreturnTx(ab); })
           }

           function checknreturnTx(srArray) { // sender and recipient Array

             if (request == true && srArray[1].requestStats.lastDate === undefined) {
               var lastRequestDate = moment(srArray[1].requestStats.lastDate).subtract(2, 'days');
             } else {
               // var lastRequestDate = moment(srArray[1].requestStats.lastDate);
             }

             return request === true && sender === undefined ? errorTx(i18n.strErTx150) :
                    request === true && amount > requestLimit ? errorTx(i18n.strErTx160 + ' ' + requestLimit + ' ' + i18n.strErTx163) :
                    request === true && ['pool', 'contribution'].indexOf(srArray[0].role) == -1 ? errorTx(i18n.strErTx170 + ' ' + srArray[0].name) :
                    request === true && srArray[0].status != 'active' ? errorTx(srArray[0].name + ' ' + i18n.strErTx180) :
                    request === true && moment(date).diff(moment(srArray[0].expires), 'days') >= 0 ? errorTx(srArray[0].name + ' ' + i18n.strErTx190) :
                    request === true && moment(date).diff(lastRequestDate, 'days') < 1 ? errorTx(i18n.strErTx200) :
                    transfer === true && (!(srArray[0].contributionData.creator == socket.user || srArray[0].poolData.creator == socket.user)) ? errorTx('You must be the pool-creator to transfer') :
                    srArray[0] == '' ? errorTx(i18n.strErTx175) :
                    amount <= 0 ? errorTx(i18n.strErTx110) :
                    (request == true || transfer == true) && reason.length < 11 ? errorTx(i18n.strErTx240) :
                    srArray[0].role == 'network' && srArray[1].role != 'network' ? errorTx(i18n.strErTx125) :
                    exp.diff(moment(date), 'days') < 0 ? errorTx(i18n.strErTx120):
                    recipients.length < 1 ? errorTx(i18n.strErTx130) :
                    request === false && recipients.indexOf(socket.user) != -1 ? errorTx(i18n.strErTx140 + ' <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strErTx141) :
                    [ amount, sender, recipients, reason, timeSecondsUNIX ];

           }

           function errorTx(error) {
             socket.emit('chat notification', { msg :'<span class="alert-text">' + error + '</span>', symbol: '&#9673;', time: date });
             throw new Error(error);
           }


         } // end async function

       })
       .then((txArray) => { // console.log('Then 2');

         return Promise.all([
           txArray[0],
           EntityDB.find({name: txArray[0][1]}).select('onChain') // using this like a ping to db
         ]);

       })
       .then((results) => { // console.log('Then 3');

         //  console.log(JSON.stringify(results));

         return Promise.all([
           results[0],
           results[1],
           checkSenderBalance(results[0], results[1][0].onChain),
         ]);

         function checkSenderBalance(txArray, onChain) {
           // var txFee = txArray[0] & 1 == 1 ? Math.ceil(txArray[0] * setTxFee) : Math.floor(txArray[0] * setTxFee); // i & 1 == 1 ? checks first bit
           var txFee = Math.ceil( txArray[0] * setTxFee );
           var burnedSenderBlocks = txArray[4] - onChain.lastMove;
           var burnedSenderBalance = Math.ceil(onChain.balance - ( onChain.balance / ( onChain.timeToZero / burnedSenderBlocks )));

           for (i = 0; i < txArray[2].length; i++) {     // loop through recipients
             burnedSenderBalance -= txArray[0] + txFee;
           }

           if (burnedSenderBalance <= 0) {

             if (request || transfer) {
               var error = i18n.strErTx210 + ' ' + txArray[0] + ' <span class="currency-unit">' + i18n.str60010 + '</span>';
               socket.emit('chat notification', { msg :'<span class="alert-text">' + error + '</span>', symbol: '&#9673;', time: date });
               throw new Error(error);

             } else {
               var error = txArray[0] > 9999 ? i18n.strErTx220 + ' ' + ( txArray[0] - onChain.balance ) + ' <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strErTx223 : i18n.strErTx230 + ' ' + txArray[0] + ' <span class="currency-unit">' + i18n.str60010 + '</span>';
               socket.emit('chat notification', { msg :'<span class="alert-text">' + error + '</span>', symbol: '&#9673;', time: date });
               throw new Error(error);
             }

           } else {return true};

         }

       })
       .then((results2) => { // console.log('Then 4');

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
           EntityDB.find({name: {$in: results2[0][2] }}).select('name onChain'),
         ]);

         async function updateSender(txArray, senderAccount) {

           var senderAcc = senderAccount[0].onChain;

           // var txFee = txArray[0] & 1 == 1 ? Math.ceil(txArray[0] * setTxFee) : Math.floor(txArray[0] * setTxFee); // i & 1 == 1 ? checks first bit
           var txFee = Math.ceil(txArray[0] * setTxFee );

           var burnedSenderBlocks = txArray[4] - senderAcc.lastMove;
           var burnedSenderBalance = Math.ceil(senderAcc.balance - ( senderAcc.balance / (senderAcc.timeToZero / burnedSenderBlocks)));
           var burnedSenderDelta = senderAcc.balance - burnedSenderBalance;
           var remainingTimeToZeroSender = senderAcc.lastMove + senderAcc.timeToZero - txArray[4]; // in sender's case it's just the remaining time to zero

           var newTotalBalance = burnedSenderBalance - ((txArray[0] + txFee) * txArray[2].length);

           await new Promise((resolve) => { EntityDB.findOne({name: txArray[1] }).exec( (err, res) => {
             res.stats.sendVolume += txArray[0];
             res.onChain.balance = newTotalBalance;
             res.onChain.lastMove = txArray[4];
             res.onChain.timeToZero = remainingTimeToZeroSender;
             res.save((err, callback) => {
               if (err) {return handleMongoDBerror('Update Recipient OnChain Data after transaction', err)};
               updateUserAccountData([txArray[1]]);
               // console.log('Sender Updated');
               resolve();

               // Community Stats
               if (callback.name != forceNiceLookingName(systemInit.communityGovernance.commName)) {

                   EntityDB.findOne({name: forceNiceLookingName(systemInit.communityGovernance.commName) }).select('stats').exec( (err, communityAccount) => {
                     communityAccount.stats.allTimeVolume += txArray[0];
                     communityAccount.save((err) => { if (err) {return handleMongoDBerror('Update Community Stats', err)}; });
                   });
               }
               // end Stats

             });
           });

         }); // close promise

           for (i = 0; i < txArray[2].length; i++) {

             var chainBalance = burnedSenderBalance - ((txArray[0] + txFee) * (i + 1));
             var burned;

             i > 0 ? burned = 0 : burned = burnedSenderDelta;

             TxDB.findOneAndUpdate(
               {name: txArray[1]},
               { $push: { txHistory: {
                 date: date,
                 initiator: initiator,
                 from: txArray[1],
                 to: txArray[2][i],
                 for: txArray[3],
                 senderFee: txFee,
                 burned: burned,
                 tt0: remainingTimeToZeroSender,
                 credit: 0,
                 debit: txArray[0],
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
       .then((results3) => { // console.log('Then 5');

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
            updateRecipient(results3),
          ]);

          async function updateRecipient(results3) {

              var txArray = results3[0];

              await new Promise((resolve) => {

               function callback () { resolve() }

               var itemsProcessed = 0;

              results3[2].forEach((recipient) => {

                var name = recipient.name;
                var recipientAcc = recipient.onChain;

                var burnedRecipientBlocks = txArray[4] - recipientAcc.lastMove;
                var burnedRecipientBalance = Math.ceil(recipientAcc.balance - ( recipientAcc.balance / (recipientAcc.timeToZero / burnedRecipientBlocks)));
                var burnedRecipientDelta = recipientAcc.balance - burnedRecipientBalance;
                var newBalance = burnedRecipientBalance + txArray[0];
                var remainingTimeToZero = recipientAcc.lastMove + recipientAcc.timeToZero - txArray[4];
                var newTimeToZero = Math.ceil(remainingTimeToZero * (burnedRecipientBalance / newBalance) + baseTimeToZero * ( txArray[0] / newBalance ));

                  EntityDB.findOneAndUpdate(
                  {name: name },
                  {
                    $set: { 'onChain.balance': newBalance,
                            'onChain.lastMove': txArray[4],
                            'onChain.timeToZero': newTimeToZero,
                    },
                    $inc: { 'stats.receiveVolume': txArray[0],
                    }
                  },
                  {
                    returnNewDocument: true,
                  },
                  (err) => {
                    if (err) {return handleMongoDBerror('Push Recipient-Tx to Database', err)};
                    updateUserAccountData([name]);

                    if (request) {

                      EntityDB.findOneAndUpdate(
                        {name: name },
                        {
                          $set: { 'requestStats.lastDate': date,
                                  'requestStats.lastPool': txArray[1],
                                  'requestStats.lastAmount': txArray[0],

                          },
                          $inc: { 'requestStats.totalRequested': txArray[0],
                          }
                        },
                        (err) => {
                          if (err) {return handleMongoDBerror('Update Recipient Request Stats in Database', err)};
                          updateTxHistory();
                        }
                      );

                    } else {

                      updateTxHistory();

                    } // end if (request)

                  }
                );
                function updateTxHistory() {

                  TxDB.findOneAndUpdate(
                    {name: name },
                    { $push: { txHistory: {
                      date: date,
                      initiator: initiator,
                      from: txArray[1],
                      to: name,
                      for: txArray[3],
                      senderFee: 0,
                      burned: burnedRecipientDelta,
                      tt0: newTimeToZero,
                      credit: txArray[0],
                      debit: 0,
                      chainBalance: newBalance,
                    }}},
                    (err) => { if (err) return handleMongoDBerror('Push Recipient-Tx to Database', err);
                        itemsProcessed++;
                        if(itemsProcessed === results3[2].length) {
                          // console.log('Recipient Updated');

                          callback();
                        }
                    });
                }

              }); // close for-loop

            }); // close Promise

          } // close updateRecipient function


          function handleMongoDBerror(req, err) {
             console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'MongoDB Error - ' + req + ' - ' + err);
          }

       })
       .then((results4) => { // console.log('Then 6');

         return Promise.all([
           results4[0],
           creditTaxToPool(results4[0]),
         ]);

         async function creditTaxToPool(txArray) {

           await new Promise((resolve) => {
              EntityDB.findOne({name: txArray[1] }).exec( (err, res) => {

                if (systemInit.poolGovernance.taxOnTx === false && ['pool','taxpool','community'].indexOf(res.role) != -1 ) { // || res.role === 'taxpool' || res.role === 'community')) {
                  resolve();
                } else {

                  EntityDB.findOne({name: taxPool.name }).exec( (err, res) => {

                   var commTax = Math.ceil( (txArray[0] * setTxFee) * systemInit.taxPool.commTax ) * txArray[2].length;

                   var recipientAcc = res.onChain;
                   var burnedRecipientBlocks = txArray[4] - recipientAcc.lastMove;
                   var burnedRecipientBalance = Math.ceil(recipientAcc.balance - ( recipientAcc.balance / (recipientAcc.timeToZero / burnedRecipientBlocks)));
                   var burnedRecipientDelta = recipientAcc.balance - burnedRecipientBalance;
                   var newBalance = burnedRecipientBalance + commTax;
                   var remainingTimeToZero = recipientAcc.lastMove + recipientAcc.timeToZero - txArray[4];
                   var newTimeToZero = Math.ceil(remainingTimeToZero * (burnedRecipientBalance / newBalance) + baseTimeToZero * ( commTax / newBalance ));

                   res.stats.receiveVolume += commTax;
                   res.onChain.balance = newBalance;
                   res.onChain.lastMove = txArray[4];
                   res.onChain.timeToZero = newTimeToZero;
                   res.save((err, res) => {
                     if (err) {return handleMongoDBerror('Update tax pool on transaction', err)};
                     updateUserAccountData([taxPool.name]);

                     TxDB.findOneAndUpdate(
                       {name: taxPool.name },
                       { $push: { txHistory: {
                         date: date,
                         initiator: initiator,
                         from: txArray[1],
                         to: taxPool.name,
                         for: 'tax',  // txArray[3], // keep reasons private
                         senderFee: 0,
                         burned: burnedRecipientDelta,
                         tt0: newTimeToZero,
                         credit: commTax,
                         debit: 0,
                         chainBalance: newBalance,
                       }}},
                       (err) => { if (err) return handleMongoDBerror('Push Recipient-Tx to Database', err);

                         socket.broadcast.to(res.profile.socketID).emit('chat notification', { msg: '<span class="confirm-text">' + i18n.strNfTx110 + ' <span class="straight-number">' + commTax + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx113 +  ' ' + txArray[1] + ' ' + i18n.strNfTx111 + '</span>', symbol: '&#9673;', time: date }); // alternatively: + reference + '</span>'
                         socket.broadcast.to(res.profile.socketID).emit('transaction received');
                         //  socket.broadcast.to(res.profile.socketID).emit('burn info message', {msg: '<span class="time">+ '+ burnedRecipientDelta + ' <span class="currency-unit">' + i18n.str60010 + '</span> were burned since your account has last been active.</span>', user: '&#9752;'});
                        resolve();

                       });
                     }); // end save to tax
                 });  // find taxPool

               } // end if/else

             }); // find sender

         }); // end Promise

       }  // end async function

       })
       .then((result5) => { // console.log('Then 7');

         //  finally send notifications to sender and recipient

        var txArray = result5[0];

        if (request) {

          EntityDB.findOne({name: txArray[1]}).select('profile').exec((err, res) => {

            socket.broadcast.to(res.profile.socketID).emit('chat notification', { msg: '<span class="confirm-text">' + i18n.strNfTx120 + ' <span class="straight-number">' + txArray[0] + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx123 + ' ' + txArray[2] + ' ' + reference + '</span>', symbol: '&#9673;', time: date });
            //  socket.broadcast.to(res.profile.socketID).emit('burn info message', {msg: '<span class="time">+ '+ burnedRecipientDelta + ' <span class="currency-unit">' + i18n.str60010 + '</span> were burned since your account has last been active.</span>', user: '&#9752;'});

          })

          socket.emit('chat notification', { msg: '<span class="confirm-text">' + i18n.strNfTx130 + ' <span class="straight-number">' + txArray[0] + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx133 + ' ' + txArray[1] + ' ' + reference + '</span>', symbol: '&#9673;', time: date }); // <br/><span class="time">+ ' + txFee + ' <span class="currency-unit">' + i18n.str60010 + '</span> were burned with this transaction.</span>
          socket.emit('transaction received');

        } else if (transfer) {

          EntityDB.findOne({name: txArray[1]}).select('profile').exec((err, res) => {
            socket.broadcast.to(res.profile.socketID).emit('chat notification', { msg: '<span class="confirm-text">' + i18n.strNfTx119 + ' <span class="straight-number">' + txArray[0] + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx123 + ' ' + txArray[2] + ' ' + reference + '</span>', symbol: '&#9673;', time: date });
            //  socket.broadcast.to(res.profile.socketID).emit('burn info message', {msg: '<span class="time">+ '+ burnedRecipientDelta + ' <span class="currency-unit">' + i18n.str60010 + '</span> were burned since your account has last been active.</span>', user: '&#9752;'});
          });

          EntityDB.find( { name: {$in: txArray[2]} }).select('profile').exec((err, res) => {
            res.forEach((recipient) => {
              socket.broadcast.to(recipient.profile.socketID).emit('chat notification', { msg: '<span class="confirm-text">' + i18n.strNfTx150 + ' <span class="straight-number">' + txArray[0] + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx133 + ' ' + txArray[1] + ' ' + reference + '</span>', symbol: '&#9673;', time: date });
              //  socket.broadcast.to(res.profile.socketID).emit('burn info message', {msg: '<span class="time">+ '+ burnedRecipientDelta + ' <span class="currency-unit">' + i18n.str60010 + '</span> were burned since your account has last been active.</span>', user: '&#9752;'});
            });
          });

          socket.emit('chat notification', { msg: '<span class="confirm-text">' + i18n.strNfTx119 + ' <span class="straight-number">' + txArray[0] + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx123 + ' ' + txArray[2] + ' ' + reference + '</span>', symbol: '&#9673;', time: date });

        } else {

          for (i = 0; i < txArray[2].length; i++) {

            EntityDB.findOne({name: txArray[2][i]}).select('profile').exec((err, res) => {

              socket.broadcast.to(res.profile.socketID).emit('chat notification', { msg: '<span class="confirm-text">' + i18n.strNfTx110 + ' <span class="straight-number">' + txArray[0] + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx133 + ' ' + txArray[1] + ' ' + i18n.strNfTx111 + reference + '</span>', symbol: '&#9673;', time: date });
              socket.broadcast.to(res.profile.socketID).emit('transaction received');
              //  socket.broadcast.to(res.profile.socketID).emit('burn info message', {msg: '<span class="time">+ '+ burnedRecipientDelta + ' <span class="currency-unit">' + i18n.str60010 + '</span> were burned since your account has last been active.</span>', user: '&#9752;'});

            })

            socket.emit('chat notification', { msg: '<span class="confirm-text">' + i18n.strNfTx140 + ' <span class="straight-number">' + txArray[0] + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx143 + ' ' + txArray[2][i] + ' ' + i18n.strNfTx145 + reference + '</span>', symbol: '&#9673;', time: date }); // <br/><span class="time">+ ' + txFee + ' <span class="currency-unit">' + i18n.str60010 + '</span> were burned with this transaction.</span>
            //  if (i === txArray[2].length - 1) { socket.emit('burn info message', {msg: '<span class="time">+ '+ burnedSenderDelta + ' <span class="currency-unit">' + i18n.str60010 + '</span> were burned since your account has last been active.</span>', user: '&#9752;'}); };
          }
       }

       })
       .catch((err) => {
         console.log('Issue handling transaction - ' + err);
        // socket.emit('chat notification', { msg: '<span class="alert-text">Sorry, an error occured</span>', symbol: '&#9673;', time: date });

       });

    });  // end socket.on('transaction')

  }); // end io.sockets.on


  function updateUserAccountData(userArray) {

     for (i = 0; i < userArray.length; i++) {

       EntityDB.findOne({name: userArray[i]}).exec(function(err, res) {
         if (err) return handleMongoDBerror('Run updateUserAccountData from DB', err);

           var userAcc = res.onChain;
               snapTimeStamp = Math.floor(Date.now() / 1000),
               remainingTimeToZero = userAcc.lastMove + userAcc.timeToZero - snapTimeStamp,
               burnedUserBalance = Math.ceil(userAcc.balance - ( userAcc.balance / (userAcc.timeToZero / ( snapTimeStamp - userAcc.lastMove )))),
               spendable = Math.floor(burnedUserBalance / (1 + setTxFee));

           res.profile.socketID != 'offline' ?
                  io.sockets.connected[res.profile.socketID].emit('user account data', { 'spendable': spendable, 'rt0': Math.ceil(remainingTimeToZero/(baseTimeToZero/daysToZero)), 'balance': userAcc.balance, 'at0': Math.floor(userAcc.timeToZero/(baseTimeToZero/daysToZero)), 'dt0': daysToZero } ) : false;

       });
     }
  }

  function handleMongoDBerror(req, err) {
     console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'MongoDB Error - ' + req + ' - ' + err);
  }

} // end module.exports
