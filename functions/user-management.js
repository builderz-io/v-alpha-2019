
const systemInit = require('../systemInit');
const i18n = require('../lang/' + systemInit.language);
const tools = require('./tools');

const ChatDB = require('../db/messages');
const EntityDB = require('../db/entities');
const TxDB = require('../db/transactions');

const moment = require('moment');
const writeEntityToDB = require('./entity-registration').writeEntityToDB;

const commName = systemInit.communityGovernance.commName;
const initialBalance = systemInit.tokenDyn.initialBalance;



// TODO: ALL admin user management has to be ubdated to reflect tags
// TODO: nukeme has to be updated


exports = module.exports = function(io) {

  io.sockets.on('connection', function (socket) {

    socket.on('verify', function(data) {

      var name = tools.forceCapOnName(data[1]);

      EntityDB.findOne({'credentials.uPhrase': data[0] }).exec( (err, res) => {
        if (err) { return tools.handleMongoDBerror('Find admin in DB', err); }

        if (res.credentials.role == 'admin') {

          EntityDB.findOne({'credentials.name': name }).exec( (err, res) => {
            if (err || res === null) {
              socket.emit('chat notification', { msg: '<span class="alert-text">' + name + ' not found</span>', symbol: '&#9673;', time: Date.now() });
              return tools.handleMongoDBerror('Find user to verify in DB', err);
            }
            res.credentials.role = 'member';
            res.credentials.status = 'active';
            res.profile.loginExpires = new Date().setMonth(new Date().getMonth() + 12);

            res.save((err) => {
              if (err) {return tools.handleMongoDBerror('Verify user in DB', err);}
              updateUserOnlineList();
              socket.emit('chat notification', { msg: '<span class="confirm-text">You verified ' + name + '</span>', symbol: '&#9673;', time: Date.now() });

            });
          });
        } else {
          socket.emit('chat notification', { msg: '<span class="alert-text">You are not authorized to verify members</span>', symbol: '&#9673;', time: Date.now() });
        }
      });

    });

    socket.on('makeadmin', function(data) {

      var name = tools.forceCapOnName(data[1]);

      EntityDB.findOne({'credentials.uPhrase': data[0] }).exec( (err, res) => {
        if (err) { return tools.handleMongoDBerror('Find admin in DB', err); }

        if (res.credentials.role == 'admin') {

          EntityDB.findOne({'credentials.name': name }).exec( (err, res) => {
            if (err || res === null) {
              socket.emit('chat notification', { msg: '<span class="alert-text">' + name + ' not found</span>', symbol: '&#9673;', time: Date.now() });
              return tools.handleMongoDBerror('Find user in DB to make admin', err);
            }
            res.credentials.role = 'admin';
            res.credentials.tag = '#2000';
            res.credentials.status = 'active';
            res.profile.loginExpires = new Date().setMonth(new Date().getMonth() + 12 * 10);

            res.save((err) => {
              if (err) {return tools.handleMongoDBerror('Set user to admin in DB', err);}
              // updateUserOnlineList();
              socket.emit('chat notification', { msg: '<span class="confirm-text">You set ' + name + ' to "admin"</span>', symbol: '&#9673;', time: Date.now() });

            });
          });
        } else {
          socket.emit('chat notification', { msg: '<span class="alert-text">You are not authorized to set members to "admin"</span>', symbol: '&#9673;', time: Date.now() });
        }
      });
    });

    socket.on('disable', function(data) {

      var name = tools.forceCapOnName(data[1]);

      EntityDB.findOne({'credentials.uPhrase': data[0] }).exec( (err, res) => {
        if (err) { return tools.handleMongoDBerror('Find admin in DB', err); }

        if (res.credentials.role == 'admin') {

          EntityDB.findOne({'credentials.name': name }).exec( (err, res) => {
            if (err || res === null) {
              socket.emit('chat notification', { msg: '<span class="alert-text">' + name + ' not found</span>', symbol: '&#9673;', time: Date.now() });
              return tools.handleMongoDBerror('Find user in DB to disable', err);
            }
            res.credentials.status = 'disabled';
            res.credentials.socketID != 'offline' ? socket.broadcast.to(res.credentials.socketID).emit('account disabled') : null;
            res.credentials.socketID = 'offline';
            res.profile.loginExpires = new Date(Date.now());

            res.save((err) => {
              if (err) {return tools.handleMongoDBerror('Disable user in DB', err);}
              updateUserOnlineList();
              socket.emit('chat notification', { msg: '<span class="confirm-text">You disabled ' + name + '</span>', symbol: '&#9673;', time: Date.now() });

            });
          });
        } else {
          socket.emit('chat notification', { msg: '<span class="alert-text">You are not authorized to "disable" members</span>', symbol: '&#9673;', time: Date.now() });
        }
      });
    });


    socket.on('nukeme', function() {
      TxDB.findOneAndRemove({'credentials.name': socket.user}).exec();
      ChatDB.remove( { sender: { $eq: socket.user } }, (err) => {
        if (err) {return tools.handleMongoDBerror('Nuke Chats in DB', err); }
      } );
      EntityDB.findOneAndRemove({'credentials.name': socket.user}).exec((err) => {
        if (err) {return tools.handleMongoDBerror('Nuke User in DB', err); }
        updateUserOnlineList();
      });

      if (systemInit.geoModule) {
        EntityDB.updateMany(
          {'properties.creator': { $eq: socket.user } },
          { $set: {
            'credentials.tatus': 'deactivated',
            'properties.expires': new Date(),
          }
          },
          (err, res) => { if (err) return tools.handleMongoDBerror('Deactivate Locations of user on nukeme', err); console.log(res);}
        );
      }

      if (systemInit.poolModule) {
        EntityDB.updateMany(
          {'properties.creator': { $eq: socket.user } },
          { $set: {
            'credentials.status': 'deactivated',
            'properties.expires': new Date(),
            'properties.fillUntil': new Date(),
          }
          },
          (err, res) => { if (err) return tools.handleMongoDBerror('Deactivate Pools of user on nukeme', err); console.log(res);}
        );
      }

      if (systemInit.contributionModule) {
        EntityDB.updateMany(
          {'properties.creator': { $eq: socket.user } },
          { $set: {
            'properties.status': 'deactivated',
            'properties.expires': new Date(),
          }
          },
          (err, res) => { if (err) return tools.handleMongoDBerror('Deactivate Contributions of user on nukeme', err); console.log(res);}
        );
      }

      delete socket.user;
      socket.emit('nukeme');
    });

    socket.on('disconnect', function() {
      // if (!socket.user) return;

      EntityDB.findOne({ 'credentials.name': socket.user }, function (err, doc) {
        if (err || doc === null) { return console.log(err);}
        doc.credentials.socketID = 'offline';
        doc.save((err) => {
          if (err) {return tools.handleMongoDBerror('Set User to offline in DB', err); }
          updateUserOnlineList();
        });
      });
    });

    socket.on('new user', function(formData, callback) {

      if ( ['vx', 'Vx'].indexOf(formData.entry.substring(0,2)) != -1 ) {

        EntityDB.findOne({ 'credentials.uPhrase': formData.entry }, function (err, res) {
          if (err) { return console.log('Error on returning user ' + err); }
          res === null ? callback(false) : socket.emit('set cookies', res.credentials.uPhrase );
        });
      }

      else {

        const date = Date.now();

        const entityData = {
          entry: formData.entry,
          uPhrase: formData.uPhrase,
          tz: formData.tz,
          role: 'network',
          status: 'active',
          socketID: String(socket.id),
          initialBalance: initialBalance,
          loginExpires: new Date(date).setMonth(new Date(date).getMonth() + 4),
        };

        writeEntityToDB(entityData).then(res => {

          // if (res === 'not allowed') { callback(false); } // we checked this already in first "if"

          if (res.saved) {
            socket.user = res.user;
            socket.userTag = res.tag;
            socket.loginExpires = res.loginExpires;
            updateUserOnlineList();
            tools.updateVisualizations(io);
            // animateSpendable();
            sendMessageHistory(res.user, res.uPhrase, false );
            socket.emit('name in header', [ res.user, commName ] );
            callback(true);

          } else {
            callback(false);
          }

        });

      } // end else

    });

    socket.on('returning user', function(data, callback) {

      const uPhrase = data[0],
        tz = data[1];

      EntityDB.findOne({ 'credentials.uPhrase': uPhrase }, function (err, doc) {

        if (err) { return console.log('Error on returning user ' + err); }

        if (doc === null) { return callback(1); }

        else if (doc.credentials.status === 'disabled') {
          socket.emit('account disabled');
          return;
        }

        else if (doc.credentials.uPhrase === uPhrase) {

          doc.profile.lastLogin = Date.now();
          doc.profile.timeZone = tz;
          doc.credentials.socketID = String(socket.id);
          doc.save((err) => {
            if (err) {return tools.handleMongoDBerror('Save Returning User to DB', err); }

            socket.user = doc.credentials.name;
            socket.userTag = doc.credentials.tag;
            socket.loginExpires = doc.profile.loginExpires;
            updateUserOnlineList();
            tools.updateVisualizations(io);
            sendMessageHistory(doc.credentials.name, uPhrase, true );
            socket.emit('name in header', [ doc.credentials.name, commName ] );

            console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + doc.credentials.name + ' ' + doc.credentials.tag + ' returned');
            return callback(2);

          });

        }

        else {
          return callback();
        }

      });

    });


    function sendMessageHistory(user, uPhrase, returningUser) {

      ChatDB.find().sort('-time').limit(100).exec(function(err, docs) {
        if (err) return tools.handleMongoDBerror('Get Message History from DB', err);
        socket.emit('chat history', docs.reverse(), function(callback) {
          callback && returningUser === true ? welcomeBack(user) : welcomeNew(user, uPhrase);
        });
      });
    }

    function welcomeBack(user) {
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
        if (err) return tools.handleMongoDBerror('Get Message History from DB', err);

        // console.log(JSON.stringify(doc));

        const items = doc[0].txHistory;
        var recentCredits = '',
          counter = 0;

        items.slice().reverse().forEach((item) => {
          if (item.to === user && item.from != commName && counter < 3) {
            recentCredits += '<span class="confirm-text"><span class="straight-number">' + item.credit + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNf10051 + ' ' + item.from + (item.for != '' ? (' ' + i18n.strNf10052 + ' ' + item.for) : '') + ' - ' + i18n.strNf10053 + moment(item.date).from() + '</span><br/><br/>' ;
            counter++;
          }
        });

        recentCredits.length > 0 ?
          socket.emit('chat notification', { msg: i18n.strNf10050 + '<br/><br/>' + recentCredits, symbol: '&#9673;', time: Date.now() }) :
          socket.emit('chat notification', { msg: i18n.strNf10060, symbol: '&#9673;', time: Date.now() }) ;

      });

    }

  });  // end io.sockets.on

  function updateUserOnlineList() {

    EntityDB.find({$and: [{'credentials.role': {$in: ['network', 'member', 'admin'] }}, {'credentials.status': 'active'}]}, { credentials: 1, _id: 0 }).exec(function(err, res) {
      if (err) return tools.handleMongoDBerror('Run updateUserOnlineList from DB', err);

      function compare(a,b) {
        if (a.credentials.name < b.credentials.name)
          return -1;
        if (a.credentials.name > b.credentials.name)
          return 1;
        return 0;
      }

      res.sort(compare);

      var online = '',
        offline = '',
        verified = '';

      for (let i = 0; i < res.length; i++) {

        if (res[i].credentials.role === 'member' || res[i].credentials.role === 'admin') {
          verified = ' <i class="fas fa-star verified-user"></i>';
        } else {
          verified = '';
        }

        if (res[i].credentials.role != 'disabled') {
          if ( res[i].credentials.socketID != 'offline' ) {
            online += '<li class="member-list">' + res[i].credentials.name + ' <i class="fas fa-user online-user"></i>' + verified + '</li>';
          } else {
            offline += '<li class="member-list">' + res[i].credentials.name + verified + '</li>';
          }
        }
      }
      io.sockets.emit('user online list', online + offline);

    });
  }

  /*
  const setTxFee = systemInit.tokenDyn.setTxFee;
  const aniLoop = 1, aniEnd = (initialBalance / (1 + setTxFee))/2;

  function animateSpendable () {
     setTimeout(function () {
       const daysToZero = systemInit.tokenDyn.daysToZero;
       const baseTimeToZero = systemInit.tokenDyn.baseTimeToZero * daysToZero;

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


};
