exports = module.exports = function(io) {

  const ChatDB = require('../db/messages');
  const EntityDB = require('../db/entities');
  const TxDB = require('../db/transactions');

  const moment = require('moment');
  const forceNiceLookingName = require('./tools.js').forceNiceLookingName;

  const systemInit = require('../systemInit');
  const i18n = require('../lang/' + systemInit.language);

  const commName = systemInit.communityGovernance.commName;
  const commNameNice = forceNiceLookingName(systemInit.communityGovernance.commName);
  const daysToZero = systemInit.tokenDyn.daysToZero;
  const baseTimeToZero = systemInit.tokenDyn.baseTimeToZero * daysToZero;
  const setTxFee = systemInit.tokenDyn.setTxFee;
  const initialBalance = systemInit.tokenDyn.initialBalance;

  io.sockets.on('connection', function (socket) {

    socket.on('verify', function(data) {

      EntityDB.findOne({uPhrase: data[0] }).exec( (err, res) => {
        if (err) { return handleMongoDBerror('Find admin in DB', err); }

        if (res.role == "admin") {

          EntityDB.findOne({name: forceNiceLookingName(data[1]) }).exec( (err, res) => {
            if (err || res === null) {
              socket.emit('chat notification', { msg: '<span class="alert-text">' + forceNiceLookingName(data[1]) + ' not found</span>', symbol: '&#9673;', time: Date.now() });
              return handleMongoDBerror('Find user to verify in DB', err);
            }
            res.profile.role = 'member';
            res.role = 'member';
            res.profile.status = 'active';
            res.status = 'active';
            res.profile.accessExpires = new Date().setMonth(new Date().getMonth() + 12);

            res.save((err) => {
              if (err) {return handleMongoDBerror('Verify user in DB', err)};
              updateUserOnlineList();
              socket.emit('chat notification', { msg: '<span class="confirm-text">You verified ' + forceNiceLookingName(data[1]) + '</span>', symbol: '&#9673;', time: Date.now() });

              // Community Stats
                EntityDB.findOne({name: commNameNice }).select('stats').exec( (err, res) => {
                  res.stats.verifiedMembers += 1;
                  res.save((err) => { if (err) {return handleMongoDBerror('Update Community Stats', err)}; });
                });
              // end Stats

            });
          });
        } else {
          socket.emit('chat notification', { msg: '<span class="alert-text">You are not authorized to verify members</span>', symbol: '&#9673;', time: Date.now() });
        }
      });

    })

    socket.on('makeadmin', function(data) {
      EntityDB.findOne({uPhrase: data[0] }).exec( (err, res) => {
          if (err) { return handleMongoDBerror('Find admin in DB', err); }

          if (res.role == "admin") {

          EntityDB.findOne({name: forceNiceLookingName(data[1]) }).exec( (err, res) => {
            if (err || res === null) {
              socket.emit('chat notification', { msg: '<span class="alert-text">' + forceNiceLookingName(data[1]) + ' not found</span>', symbol: '&#9673;', time: Date.now() });
              return handleMongoDBerror('Find user in DB to make admin', err);
            }
            res.profile.role = 'admin';
            res.role = 'admin';
            res.profile.status = 'active';
            res.status = 'active';
            res.profile.accessExpires = new Date().setMonth(new Date().getMonth() + 12 * 10);

            res.save((err) => {
              if (err) {return handleMongoDBerror('Set user to admin in DB', err)};
              // updateUserOnlineList();
              socket.emit('chat notification', { msg: '<span class="confirm-text">You set ' + forceNiceLookingName(data[1]) + ' to "admin"</span>', symbol: '&#9673;', time: Date.now() });

            });
          });
        } else {
          socket.emit('chat notification', { msg: '<span class="alert-text">You are not authorized to set members to "admin"</span>', symbol: '&#9673;', time: Date.now() });
        }
      });
    })

    socket.on('grace', function(data) {

      if (systemInit.uPhrase.indexOf(data[0]) != -1) {

        EntityDB.findOne({name: forceNiceLookingName(data[1]) }).exec( (err, res) => {
          if (err || res === null) {
            socket.emit('chat notification', { msg: '<span class="alert-text">' + forceNiceLookingName(data[1]) + ' not found</span>', symbol: '&#9673;', time: Date.now() });
            return handleMongoDBerror('Find user to set grace in DB', err);
          }
          var name = res.profile.name;
          res.profile.role = 'grace';
          res.role = 'grace';
          res.profile.name = name + '-graced';
          res.name = name + '-graced';
          res.profile.socketID != 'offline' ? socket.broadcast.to(res.profile.socketID).emit('account graced') : null;
          res.profile.socketID = 'offline';
          res.save((err, res) => {
            if (err) {return handleMongoDBerror('Set user to grace in DB', err)};
            updateUserOnlineList();
            socket.emit('chat notification', { msg: '<span class="confirm-text">You set ' + forceNiceLookingName(data[1]) + ' to "grace"</span>', symbol: '&#9673;', time: Date.now() });

            TxDB.findOneAndUpdate(
              { name: name },
              { name: name + '-graced' },
              (err) => { if (err) return handleMongoDBerror('Grace User in TxDB', err)}
            );

            ChatDB.remove( { sender: { $eq: name } }, (err, data) => {
              socket.emit('chat notification', { msg: '<span class="confirm-text">Deleted ' + data.n + ' messages by ' + name + '</span>', symbol: '&#9673;', time: Date.now() });
            } );

          });
        });
      } else {
        socket.emit('chat notification', { msg: '<span class="alert-text">You are not authorized to "grace" members</span>', symbol: '&#9673;', time: Date.now() });
      }
    })

    socket.on('disconnect', function() {
      if(!socket.user) return;

      EntityDB.findOne({ name: socket.user }, function (err, doc) {
        if (err || doc === null) { return console.log(err);}
        doc.profile.socketID = 'offline';
        doc.save((err) => {
          if (err) {return handleMongoDBerror('Set User to offline in DB', err) };
          updateUserOnlineList();
        });
      });
    });

    socket.on('nukeme', function() {
      TxDB.findOneAndRemove({name: socket.user}).exec();
      ChatDB.remove( { sender: { $eq: socket.user } }, (err, data) => {
        if (err) {return handleMongoDBerror('Nuke Chats in DB', err) };
      } );
      EntityDB.findOneAndRemove({name: socket.user}).exec((err) => {
        if (err) {return handleMongoDBerror('Nuke User in DB', err) };
        updateUserOnlineList();
      });

      if (systemInit.geoModule) {
        EntityDB.updateMany(
          {"properties.creator": { $eq: socket.user } },
          { $set: {
              'properties.status': 'deactivated',
              'status': 'deactivated',
            }
          },
          (err, res) => { if (err) return handleMongoDBerror('Deactivate Locations of user on nukeme', err); console.log(res);}
        );
      };

      if (systemInit.poolModule) {
        EntityDB.updateMany(
          {"poolData.creator": { $eq: socket.user } },
          { $set: {
              'profile.status': 'deactivated',
              'status': 'deactivated',
              'poolData.expires': new Date(),
              'poolData.fillUntil': new Date(),
              'poolData.status': 'deactivated',
            }
          },
          (err, res) => { if (err) return handleMongoDBerror('Deactivate Pools of user on nukeme', err); console.log(res);}
        );
      };

      if (systemInit.contributionModule) {
        EntityDB.updateMany(
          {"contributionData.creator": { $eq: socket.user } },
          { $set: {
              'profile.status': 'deactivated',
              'status': 'deactivated',
              'contributionData.expires': new Date(),
              'contributionData.status': 'deactivated',
            }
          },
          (err, res) => { if (err) return handleMongoDBerror('Deactivate Contributions of user on nukeme', err); console.log(res);}
        );
      };

      delete socket.user;
      socket.emit('nukeme');
    });


    socket.on('new user', function(userData, callback) {

      var user = userData[0],
          uPhrase = userData[1],
          entry = userData[2],
          tz = userData[3];

      if (systemInit.phraseChars.twoChars.indexOf(entry.substring(0,2)) != -1 || systemInit.phraseChars.threeChars.indexOf(entry.substring(0,3)) != -1) {

         EntityDB.findOne({ uPhrase: entry }, function (err, doc) {
            if (err) { return console.log('Error on returning user ' + err); };
            doc === null ? callback(false) : socket.emit('set cookies', doc.uPhrase );
          });

      } else {

        EntityDB.find().distinct('name')
          .then((entityList) => {

              if (entityList.indexOf(user) != -1 || user.length > 12 || user.length < 2) {
                  throw new Error()
              } else {
                  var date = new Date();
                  var expiryDate = new Date(date).setMonth(new Date(date).getMonth() + 4);
                  socket.accessExpires = expiryDate;
                  socket.user = user;
                  var newUser = new EntityDB({
                    name: user,
                    uPhrase: uPhrase,
                    role: 'network',
                    status: 'unverified',
                    stats: {
                      sendVolume: 0,
                      receiveVolume: 0,
                    },
                    profile: {
                      joined: date,
                      lastLogin: date,
                      accessExpires: expiryDate,
                      name: user,
                      timeZone: tz,
                      role: 'network',
                      status: 'unverified',
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
                      initiator: commName,
                      from: commName,
                      to: user,
                      for: i18n.strInit110,
                      senderFee: 0,
                      burned: 0,
                      tt0: baseTimeToZero,
                      credit: initialBalance,
                      debit: 0,
                      chainBalance: initialBalance,
                    }
                  }).save((err) => { if (err) return handleMongoDBerror('Save Welcome Balance to DB', err);
                  });

                  newUser.save((err) => {
                    if (err) {return handleMongoDBerror('Save New User to DB', err) };
                    updateUserOnlineList();
                     updateUserAccountData([user]);
                    // animateSpendable();
                  }),

                  sendMessageHistory(user, uPhrase, false );

                  socket.emit('name in header', [ socket.user, commName ] );

                  console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + user + ' registered and added to list');

                  return callback(true);
              };

          })
          .catch((err) => {
            callback(false)
            console.log('Issue with new user signup - ' + err);

          })
      }
    });

    socket.on('returning user', function(data, callback) {

      var uPhrase = data[0],
          tz = data[1];

      EntityDB.findOne({ uPhrase: uPhrase }, function (err, doc) {

          if (err) { return console.log('Error on returning user ' + err); };
          if (doc === null) {
            return callback(1);
          };

          if (doc.role === 'grace') {
            socket.emit('account graced');
            return;
          }

          if (doc.uPhrase === uPhrase) {
            socket.accessExpires = doc.profile.accessExpires;
            socket.user = doc.name;
            sendMessageHistory(doc.name, uPhrase, true );
            updateUserAccountData([doc.name]);
            socket.emit('name in header', [ doc.name, commName ] );

              doc.profile.lastLogin = Date.now();
              doc.profile.timeZone = tz;
              doc.profile.socketID = String(socket.id);
              doc.save((err) => {
                if (err) {return handleMongoDBerror('Save Returning User to DB', err) };
                updateUserOnlineList();
                updateUserAccountData([doc.name]);
              });
              console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + doc.name + ' returned');
            return callback(2);

          } else {
            return callback();
          }

      });

    });


    function sendMessageHistory(user, uPhrase, retUser) {

        ChatDB.find({}).sort('-time').limit(100).exec(function(err, docs) {
                      if (err) return handleMongoDBerror('Get Message History from DB', err);
                      socket.emit('chat history', docs.sort('time'), function(callback) {
                        callback && retUser === true ? welcomeBack(user, uPhrase) : welcomeNew(user, uPhrase);
                      });
                   });
      }

    function welcomeBack(user, uPhrase) {
        socket.emit('chat notification', { msg: socket.user + ' - ' + i18n.strNf10040, symbol: '&#9673;', time: Date.now() });
        constructRecentCredits(user);
      }

    function welcomeNew(user, uPhrase) {
        //  socket.emit('chat notification', { msg: user + ' - Welcome!', symbol: '&#9673;', time: Date.now() });
        socket.emit('chat notification', { msg: user + ' - ' + i18n.strNf10010 + ' ' + commName + ' !<br/><br/><span class="alert-text alert-bgrd">' + uPhrase + '</span><br/><br/><span class="alert-text alert-bgrd">' + i18n.strNf10020 + '</span><br/><br/>' + i18n.strNf10023, symbol: '&#9673;', time: Date.now() });
        socket.emit('chat notification', { msg: i18n.strNf10030, symbol: '&#9673;', time: Date.now() });
        //  socket.emit('chat notification', { msg: 'Note that you are still experimenting with an alpha test version. Your messages and transactions may be deleted without warning.', symbol: '&#9673;', time: Date.now() });
        //  socket.emit('chat notification', { msg: 'We recommend using Firefox as browser.', symbol: '&#9673;', time: Date.now() });

      }

    function constructRecentCredits(user) {

         TxDB.find({name: user}, { txHistory: { $slice: -180 } }).exec(function(err, doc) {  // { txHistory: { $slice: -3 } }  // {$and: [{name: user},  { "txHistory.from": { $ne: user } }]}
                if (err) return handleMongoDBerror('Get Message History from DB', err);

                // console.log(JSON.stringify(doc));

                 var items = doc[0].txHistory,
                     recentCredits = '',
                     counter = 0;

                items.slice().reverse().forEach((item) => {
                  if (item.to === user && item.from != commName && counter < 3) {
                    recentCredits += '<span class="confirm-text"><span class="straight-number">' + item.credit + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNf10051 + ' ' + item.from + (item.for != '' ? (' ' + i18n.strNf10052 + ' ' + item.for) : '') + ' - ' + i18n.strNf10053 + moment(item.date).from() + '</span><br/><br/>' ;
                    counter++;
                  }
                })

                recentCredits.length > 0 ?
                  socket.emit('chat notification', { msg: i18n.strNf10050 + '<br/><br/>' + recentCredits, symbol: '&#9673;', time: Date.now() }) :
                  socket.emit('chat notification', { msg: i18n.strNf10060, symbol: '&#9673;', time: Date.now() }) ;

        });

      }

    /* var aniLoop = 1, aniEnd = (initialBalance / (1 + setTxFee))/2;

      function animateSpendable () {
         setTimeout(function () {
           socket.emit('user account data', { 'spendable': aniLoop * 2, 'rt0': Math.floor(baseTimeToZero/(baseTimeToZero/daysToZero) - aniEnd + aniLoop), 'balance': initialBalance, 'at0': Math.floor(baseTimeToZero/(baseTimeToZero/daysToZero)), 'dt0': daysToZero } );
            aniLoop++;
            if (aniLoop < aniEnd + 1) {
               animateSpendable();
            } else {
              return
            }
         }, aniLoop * 7)
      }
      */

  });  // end io.sockets.on

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

  function updateUserOnlineList() {

    EntityDB.find({role: {$in: ['network', 'member', 'admin'] }}).select('profile').exec(function(err, res) {
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

              if (res[i].profile.role === 'member' || res[i].profile.role === 'admin') {
                var verified = ' <i class="fas fa-star verified-user"></i>' ;
              } else {
                var verified = '' ;
              }
              if (res[i].profile.role != 'grace') {
                if ( res[i].profile.socketID != 'offline' ) {
                  online += '<li class="member-list">' + res[i].profile.name + ' <i class="fas fa-user online-user"></i>' + verified + '</li>';
                } else {
                  offline += '<li class="member-list">' + res[i].profile.name + verified + '</li>';
                }
              }
            }
            io.sockets.emit('user online list', online + offline);

     });
  }

  function handleMongoDBerror(req, err) {
     console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'MongoDB Error - ' + req + ' - ' + err);
  }

}
