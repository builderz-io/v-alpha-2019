
const systemInit = require( '../systemInit' );
const i18n = require( '../lang/' + systemInit.language );
const tools = require( './tools' );

const ChatDB = require( '../db/messages' );
const EntityDB = require( '../db/entities' );
const TxDB = require( '../db/transactions' );

const moment = require( 'moment' );
const writeEntityToDB = require( './entity-registration' ).writeEntityToDB;

const findEntities = require( './find-entities' );

const allowPublic = systemInit.communityGovernance.allowPublic;

const commName = systemInit.communityGovernance.commName;
const initialBalance = systemInit.tokenDyn.initialBalance;


exports = module.exports = function( io ) {

  io.sockets.on( 'connection', function( socket ) {

    socket.on( 'get all entities', function( data, callback ) {
      EntityDB.find( {'fullId': {'$regex': new RegExp( data[0], 'i' ) }} ).select( 'fullId' ).exec( function( err, docs ) {
        if ( err ) { console.log( 'Error: ' + err )}
        callback( docs.map( doc => { return doc.fullId } ).filter( fullId => { return fullId != data[1] } ) );
      } );
    } );

    socket.on( 'verify', function( data ) {

      const messageParts = data[0];
      const uPhrase = data[1];

      findEntities.findAllEntities( messageParts, uPhrase )
        .then( entities => {

          var findAdmin = entities[2].credentials.name + entities[2].credentials.tag;
          var commAdmins = JSON.parse( JSON.stringify( entities[0].admins.map( admin => { return admin.adminName + admin.adminTag } ) ) );

          if ( commAdmins.includes( findAdmin ) && entities[3] ) {

            EntityDB.findOne( { '$and': [{ 'credentials.name': entities[3].credentials.name }, { 'credentials.tag': entities[3].credentials.tag }] } ).exec( ( err, res ) => {
              if ( err || res === null ) {
                return tools.handleMongoDBerror( 'Find user in DB to verify', err );
              }
              res.credentials.role = 'member';
              res.credentials.status = 'active';
              res.profile.loginExpires = new Date().setMonth( new Date().getMonth() + 12 );

              res.save( ( err ) => {
                if ( err ) { return tools.handleMongoDBerror( 'Verify user in DB', err ) }
                updateUserOnlineList();
                socket.emit( 'chat notification', { 'msg': '<span class="confirm-text">You verifed ' + entities[3].credentials.name + ' ' + entities[3].credentials.tag + '</span>', 'symbol': '&#9673;', 'time': Date.now() } );
              } );
            } );

          }
          else if ( !entities[3] ) {
            socket.emit( 'chat notification', { 'msg': '<span class="alert-text">Could not ' + messageParts.join( ' ' ) + ' - not found.</span>', 'symbol': '&#9673;', 'time': Date.now() } );
          }
          else {
            socket.emit( 'chat notification', { 'msg': '<span class="alert-text">You are not authorized to "verify" network members</span>', 'symbol': '&#9673;', 'time': Date.now() } );
          }
        } ); // close then
    } );

    socket.on( 'makeadmin', function( data ) {

      const messageParts = data[0];
      const uPhrase = data[1];

      findEntities.findAllEntities( messageParts, uPhrase )
        .then( entities => {

          if ( entities[3] ) {

            EntityDB.findOneAndUpdate(
              { '$and': [{'credentials.name': entities[2].credentials.name }, {'credentials.tag': entities[2].credentials.tag }] },
              { '$push': { 'admins': {
                'adminName': entities[3].credentials.name,
                'adminTag': entities[3].credentials.tag,
              }}},
              ( err ) => {
                if ( err ) { return tools.handleMongoDBerror( 'Push Admin to User in Database', err ) }
                socket.emit( 'chat notification', { 'msg': '<span class="confirm-text">You made ' + entities[3].credentials.name + ' ' + entities[3].credentials.tag + ' an admin</span>', 'symbol': '&#9673;', 'time': Date.now() } );
              } // close callback
            ); // close findOneAndUpdate

          }
          else {
            socket.emit( 'chat notification', { 'msg': '<span class="alert-text">Could not ' + messageParts.join( ' ' ) + ' - not found.</span>', 'symbol': '&#9673;', 'time': Date.now() } );
          }
        } );
    } );

    socket.on( 'revokeadmin', function( data ) {

      const messageParts = data[0];
      const uPhrase = data[1];

      findEntities.findAllEntities( messageParts, uPhrase )
        .then( entities => {

          if ( entities[3] ) {

            EntityDB.findOneAndUpdate(
              { '$and': [{'credentials.name': entities[2].credentials.name }, {'credentials.tag': entities[2].credentials.tag }] },
              { '$pull': { 'admins': {
                'adminName': entities[3].credentials.name,
                'adminTag': entities[3].credentials.tag,
              }}},
              ( err ) => {
                if ( err ) { return tools.handleMongoDBerror( 'Remove Admin from User in Database', err ) }
                socket.emit( 'chat notification', { 'msg': '<span class="confirm-text">You removed ' + entities[3].credentials.name + ' ' + entities[3].credentials.tag + ' as admin</span>', 'symbol': '&#9673;', 'time': Date.now() } );
              } // close callback
            ); // close findOneAndUpdate

          }
          else {
            socket.emit( 'chat notification', { 'msg': '<span class="alert-text">Could not ' + messageParts.join( ' ' ) + ' - not found.</span>', 'symbol': '&#9673;', 'time': Date.now() } );
          }
        } );
    } );

    socket.on( 'disable', function( data ) {

      const messageParts = data[0];
      const uPhrase = data[1];

      findEntities.findAllEntities( messageParts, uPhrase )
        .then( entities => {

          var findAdmin = entities[2].credentials.name + entities[2].credentials.tag;
          var commAdmins = JSON.parse( JSON.stringify( entities[0].admins.map( admin => {return admin.adminName + admin.adminTag } ) ) );

          if ( commAdmins.includes( findAdmin ) && entities[3] ) {

            EntityDB.findOne( { '$and': [{'credentials.name': entities[3].credentials.name }, {'credentials.tag': entities[3].credentials.tag }] } ).exec( ( err, res ) => {
              if ( err || res === null ) {
                return tools.handleMongoDBerror( 'Find user in DB to disable', err );
              }
              res.credentials.status = 'disabled';
              res.credentials.socketID != 'offline' ? socket.broadcast.to( res.credentials.socketID ).emit( 'account disabled' ) : null;
              res.credentials.socketID = 'offline';
              res.profile.loginExpires = new Date( Date.now() );

              res.save( ( err ) => {
                if ( err ) { return tools.handleMongoDBerror( 'Disable user in DB', err ) }
                updateUserOnlineList();
                socket.emit( 'chat notification', { 'msg': '<span class="confirm-text">You disabled ' + entities[3].credentials.name + ' ' + entities[3].credentials.tag + '</span>', 'symbol': '&#9673;', 'time': Date.now() } );

              } );
            } );
          }
          else if ( !entities[3] ) {
            socket.emit( 'chat notification', { 'msg': '<span class="alert-text">Could not ' + messageParts.join( ' ' ) + ' - not found.</span>', 'symbol': '&#9673;', 'time': Date.now() } );
          }
          else {
            socket.emit( 'chat notification', { 'msg': '<span class="alert-text">You are not authorized to "disable" members</span>', 'symbol': '&#9673;', 'time': Date.now() } );
          }
        } ); // close then
    } );

    socket.on( 'enable', function( data ) {

      const messageParts = data[0];
      const uPhrase = data[1];

      findEntities.findAllEntities( messageParts, uPhrase )
        .then( entities => {

          var findAdmin = entities[2].credentials.name + entities[2].credentials.tag;
          var commAdmins = JSON.parse( JSON.stringify( entities[0].admins.map( admin => { return admin.adminName + admin.adminTag } ) ) );

          if ( commAdmins.includes( findAdmin ) && entities[3] ) {

            EntityDB.findOne( { '$and': [{'credentials.name': entities[3].credentials.name }, {'credentials.tag': entities[3].credentials.tag }] } ).exec( ( err, res ) => {
              if ( err || res === null ) {
                return tools.handleMongoDBerror( 'Find user in DB to enable', err );
              }
              res.credentials.status = 'active';
              res.credentials.role = 'member';
              res.profile.loginExpires = new Date( Date.now() ).setMonth( new Date( Date.now() ).getMonth() + 12 );

              res.save( ( err ) => {
                if ( err ) { return tools.handleMongoDBerror( 'Enable user in DB', err ) }
                updateUserOnlineList();
                socket.emit( 'chat notification', { 'msg': '<span class="confirm-text">You enabled ' + entities[3].credentials.name + ' ' + entities[3].credentials.tag + '</span>', 'symbol': '&#9673;', 'time': Date.now() } );

              } );
            } );
          }
          else if ( !entities[3] ) {
            socket.emit( 'chat notification', { 'msg': '<span class="alert-text">Could not ' + messageParts.join( ' ' ) + ' - not found.</span>', 'symbol': '&#9673;', 'time': Date.now() } );
          }
          else {
            socket.emit( 'chat notification', { 'msg': '<span class="alert-text">You are not authorized to "enable" members</span>', 'symbol': '&#9673;', 'time': Date.now() } );
          }
        } );
    } );

    // TODO: nukeme has to be revised and updated

    socket.on( 'nukeme', function() {
      TxDB.findOneAndRemove( {'credentials.name': socket.user} ).exec();
      ChatDB.remove( { 'sender': { '$eq': socket.user } }, ( err ) => {
        if ( err ) {return tools.handleMongoDBerror( 'Nuke Chats in DB', err ) }
      } );
      EntityDB.findOneAndRemove( {'credentials.name': socket.user} ).exec( ( err ) => {
        if ( err ) {return tools.handleMongoDBerror( 'Nuke User in DB', err ) }
        updateUserOnlineList();
      } );

      if ( systemInit.geoModule ) {
        EntityDB.updateMany(
          {'properties.creator': { '$eq': socket.user } },
          { '$set': {
            'credentials.status': 'deactivated',
            'properties.expires': new Date(),
          }
          },
          ( err, res ) => { if ( err ) { console.log( res ); return tools.handleMongoDBerror( 'Deactivate Locations of user on nukeme', err ) } }
        );
      }

      if ( systemInit.poolModule ) {
        EntityDB.updateMany(
          {'properties.creator': { '$eq': socket.user } },
          { '$set': {
            'credentials.status': 'deactivated',
            'properties.expires': new Date(),
            'properties.fillUntil': new Date(),
          }
          },
          ( err, res ) => { if ( err ) { console.log( res ); return tools.handleMongoDBerror( 'Deactivate Pools of user on nukeme', err ) } }
        );
      }

      if ( systemInit.contributionModule ) {
        EntityDB.updateMany(
          {'properties.creator': { '$eq': socket.user } },
          { '$set': {
            'properties.status': 'deactivated',
            'properties.expires': new Date(),
          }
          },
          ( err, res ) => { if ( err ) { console.log( res ); return tools.handleMongoDBerror( 'Deactivate Contributions of user on nukeme', err ) } }
        );
      }

      delete socket.user;
      socket.emit( 'nukeme' );
    } );

    socket.on( 'disconnect', function() {
      if ( !socket.user ) { return }

      EntityDB.findOne( {'$and': [{ 'credentials.name': socket.user }, { 'credentials.tag': socket.userTag }]}, function( err, doc ) {
        if ( err || doc === null ) { return console.log( err ) }
        doc.credentials.socketID = 'offline';
        doc.save( ( err ) => {
          if ( err ) {return tools.handleMongoDBerror( 'Set User to offline in DB', err ) }
          updateUserOnlineList();
        } );
      } );
    } );

    socket.on( 'new user', function( formData, callback ) {

      if ( allowPublic != true ) {
        return callback( 'not public' );
      }

      else if ( ['vx', 'Vx'].includes( formData.entry.substring( 0, 2 ) ) ) {
        EntityDB.findOne( { 'credentials.uPhrase': formData.entry }, function( err, res ) {
          if ( err ) { return console.log( 'Error on returning user ' + err ) }
          return res === null ? callback( false ) : socket.emit( 'set cookies', res.credentials.uPhrase );
        } );
      }

      else {

        const date = Date.now();

        const entityData = {
          'entry': formData.entry,
          'uPhrase': formData.uPhrase,
          'tz': formData.tz,
          'role': 'network',
          'status': 'active',
          'ownerAdmin': {
            'creator': formData.entry,
            'creatorTag': systemInit.initTag,
          },
          'socketID': String( socket.id ),
          'initialBalance': initialBalance,
          'loginExpires': new Date( date ).setMonth( new Date( date ).getMonth() + 4 ),
          'ethCredentials': {},
        };

        writeEntityToDB( entityData ).then( res => {

          if ( res.saved ) {
            socket.user = res.user;
            socket.userTag = res.tag;
            socket.loginExpires = res.loginExpires;
            updateUserOnlineList();
            tools.updateVisualizations( io );
            // animateSpendable();
            sendMessageHistory( res.user, res.uPhrase, false );
            socket.emit( 'name in header', [ res.user, res.tag, commName ] );
            return callback( true );
          }
          else {
            return callback( false );
          }
        } );
      } // end else
    } );

    socket.on( 'returning user', function( data, callback ) {

      const uPhrase = data[0],
        tz = data[1],
        date = Date.now();

      EntityDB.findOne( { 'credentials.uPhrase': uPhrase }, function( err, doc ) {

        if ( err ) { return console.log( 'Error on returning user ' + err ) }

        if ( doc === null ) {
          return callback( 1 );
        }
        else if ( moment( doc.profile.loginExpires ).diff( moment( date ), 'days' ) <= 0 ) {
          socket.emit( 'account disabled' );
        }
        else if ( doc.credentials.uPhrase === uPhrase ) {

          if ( doc.credentials.role === 'member' ) {
            doc.profile.loginExpires = new Date( date ).setMonth( new Date( date ).getMonth() + 14 );
          }

          doc.profile.lastLogin = date;
          doc.profile.timeZone = tz;
          doc.credentials.socketID = String( socket.id );
          doc.save( ( err ) => {
            if ( err ) {return tools.handleMongoDBerror( 'Save Returning User to DB', err ) }

            socket.user = doc.credentials.name;
            socket.userTag = doc.credentials.tag;
            socket.loginExpires = doc.profile.loginExpires;

            updateUserOnlineList();
            tools.updateVisualizations( io );
            sendMessageHistory( doc.credentials.name, uPhrase, true );
            socket.emit( 'name in header', [ doc.credentials.name, doc.credentials.tag, commName ] );

            console.log( '(' + moment().format( 'D MMM YYYY h:mm a' ) + ') ' + doc.credentials.name + ' ' + doc.credentials.tag + ' returned' );
            return callback( 2 );

          } );
        }
        else {
          return callback();
        }
      } );
    } );


    function sendMessageHistory( user, uPhrase, returningUser ) {
      ChatDB.find().sort( '-time' ).limit( 100 ).exec( function( err, docs ) {
        if ( err ) { return tools.handleMongoDBerror( 'Get Message History from DB', err ) }
        socket.emit( 'chat history', docs.reverse(), function( callback ) {
          callback && returningUser ? welcomeBack() : welcomeNew( user, uPhrase );
        } );
      } );
    }

    function welcomeBack() {
      socket.emit( 'chat notification', { 'msg': i18n.strNf10040 + ', ' + socket.user + '! ' + i18n.strNf10045, 'symbol': '&#9673;', 'time': Date.now() } );
      constructRecentCredits( socket.user, socket.userTag );
    }

    function welcomeNew( user, uPhrase ) {
      //  socket.emit('chat notification', { msg: user + ' - Welcome!', symbol: '&#9673;', time: Date.now() });
      socket.emit( 'welcome new user', { 'msg': user + ' - ' + i18n.strNf10010 + ' ' + commName + ' !<br/><br/><span class="alert-text alert-bgrd" id="uPhrase-welcome">' + uPhrase + '</span><button class="copy-btn strong-weight" onclick="copyToClipboard(' + '"#uPhrase-welcome"' + ')">' + i18n.strNf10070 + '</button><br/><br/><span class="alert-text alert-bgrd">' + i18n.strNf10020 + '</span><br/><br/>' + i18n.strNf10023 + '<br/><br/>' + i18n.strNf10030, 'symbol': '&#9673;', 'time': Date.now() } );
      // socket.emit('welcome new user', { msg: i18n.strNf10030, symbol: '&#9673;', time: Date.now() });
      //  socket.emit('chat notification', { msg: 'Note that you are still experimenting with an alpha test version. Your messages and transactions may be deleted without warning.', symbol: '&#9673;', time: Date.now() });
      //  socket.emit('chat notification', { msg: 'We recommend using Firefox as browser.', symbol: '&#9673;', time: Date.now() });

    }

    function constructRecentCredits( user, userTag ) {

      TxDB.findOne( {'$and': [{'name': user}, {'tag': userTag}]}, { 'txHistory': { '$slice': -180 } } ).exec( function( err, doc ) {  // { txHistory: { $slice: -3 } }  // {$and: [{name: user},  { "txHistory.from": { $ne: user } }]}

        const items = doc.txHistory;
        var recentCredits = '',
          counter = 0;

        if ( err ) { return tools.handleMongoDBerror( 'Get Message History from DB', err ) }

        items.slice().reverse().forEach( ( item ) => {
          if ( item.to === user && item.from != commName && counter < 1 && moment( item.date ).diff( moment( Date.now() ), 'days' ) < 14 ) {
            recentCredits += '<span class="confirm-text"><span class="straight-number">' + item.credit + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNf10051 + ' ' + item.from + ( item.for != '' ? ( ' ' + i18n.strNf10052 + ' ' + item.for ) : '' ) + ' - ' + i18n.strNf10053 + moment( item.date ).from() + '</span>';
            counter++;
          }
        } );

        recentCredits.length > 0 ?
          socket.emit( 'chat notification', { 'msg': recentCredits, 'symbol': '&#9673;', 'time': Date.now() } ) : // i18n.strNf10050 + '<br/><br/>' +
          null; // socket.emit('chat notification', { msg: i18n.strNf10060, symbol: '&#9673;', time: Date.now() }) ;

      } );
    }
  } );  // end io.sockets.on

  function updateUserOnlineList() {

    EntityDB.find( {'$and': [{'credentials.role': {'$in': ['network', 'member'] }}, {'credentials.status': 'active'}]}, { 'credentials': 1, '_id': 0 } ).exec( function( err, res ) {

      var online = '',
        offline = '',
        verified;

      if ( err ) { return tools.handleMongoDBerror( 'Run updateUserOnlineList from DB', err ) }

      function compare( a, b ) {
        if ( a.credentials.name < b.credentials.name ) {
          return -1;
        }
        if ( a.credentials.name > b.credentials.name ) {
          return 1;
        }
        return 0;
      }

      res.sort( compare );

      for ( let i = 0; i < res.length; i++ ) {

        if ( res[i].credentials.role === 'member' ) {
          verified = ' <i class="fas fa-star verified-user"></i>';
        }
        else {
          verified = '';
        }

        if ( res[i].credentials.role != 'disabled' ) {
          if ( res[i].credentials.socketID != 'offline' ) {
            online += '<li class="member-list">' + res[i].credentials.name + ' <i class="fas fa-user online-user"></i>' + verified + '</li>';
          }
          else {
            offline += '<li class="member-list">' + res[i].credentials.name + verified + '</li>';
          }
        }
      }
      io.sockets.emit( 'user online list', online + offline );

    } );
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
