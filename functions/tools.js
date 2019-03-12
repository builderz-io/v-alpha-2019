
const systemInit = require( '../systemInit' );
const i18n = require( '../lang/' + systemInit.language );

const EntityDB = require( '../db/entities' );
const TxDB = require( '../db/transactions' );

const moment = require( 'moment' );

const commName = systemInit.communityGovernance.commName;
const daysToZero = systemInit.tokenDyn.daysToZero;
const baseTimeToZero = systemInit.tokenDyn.baseTimeToZero * daysToZero;
const setTxFee = systemInit.tokenDyn.setTxFee;

module.exports.notifications = ( notificationObj ) => {

  if ( systemInit.telegramModule.on ) {

    function telegram() {
      const telegramAPI = require( './plugins/telegram/telegram' );
      telegramAPI.telegramAdminNotification( notificationObj );
    }
    systemInit.telegramModule.adminNotifications ? telegram() : null;
  }

  if ( systemInit.emailModule.on ) {

    function email() {
      const emailer = require( './plugins/emailer/emailer' );
      const address = systemInit.communityGovernance.adminEmail;
      emailer.entityMailer( notificationObj, address );
    }
    systemInit.emailModule.adminNotifications ? email() : null;
  }

}


module.exports.constructTx = ( data ) => {
  const messageParts = data,
    date = Date.now(),
    timeSecondsUNIX = Number( Math.floor( date / 1000 ) ),
    forIndex = messageParts.indexOf( i18n.str50010 );

  let reference = '';

  if ( forIndex != -1 ) {
    reference = messageParts.slice( forIndex + 1, messageParts.length ).join( ' ' ).trim();
    messageParts.splice( forIndex, messageParts.length - forIndex );
  }
  const amount = messageParts.filter( function( item ) { return Number( parseInt( item ) == item ) } ).reduce( function( acc, val ) { return Number( acc ) + Number( val ) }, 0 );

  return {
    'date': date,
    'amount': amount,
    'reference': reference,
    'timeSecondsUNIX': timeSecondsUNIX,
  };
}

module.exports.updateVisualizations = ( io ) => {

  try {

    EntityDB.find( {'credentials.socketID': {$ne: 'offline'}}, { credentials: true, onChain: true, _id: false } ).exec( function( err, res ) {
      if ( err ) { console.log( 'Error updating visualizations - ' + err ); return }

      for ( let i = 0; i < res.length; i++ ) {
        const userAcc = res[i].onChain,
          snapTimeStamp = Math.floor( Date.now() / 1000 ),
          remainingTimeToZero = userAcc.lastMove + userAcc.timeToZero - snapTimeStamp,
          burnedUserBalance = Math.ceil( userAcc.balance - ( userAcc.balance / ( userAcc.timeToZero / ( snapTimeStamp - userAcc.lastMove ) ) ) ),
          spendable = Math.floor( burnedUserBalance / ( 1 + systemInit.tokenDyn.setTxFee ) );

        io.sockets.connected[res[i].credentials.socketID].emit( 'user account data', {
          spendable: spendable,
          rt0: Math.ceil( remainingTimeToZero/( baseTimeToZero/daysToZero ) ),
          balance: userAcc.balance,
          at0: Math.floor( userAcc.timeToZero/( baseTimeToZero/daysToZero ) ),
          dt0: daysToZero,
        } );
      }
    } );

  }
  catch ( err ) {
    console.log( 'Error updating visualizations (caught) - ' + err );
  }
};

module.exports.updateEntityVisualizations = ( entityData, io ) => {

  var spendable;

  if ( entityData.socketID != 'offline' ) {
    spendable = Math.floor( entityData.balance / ( 1 + setTxFee ) );
    rt0 = Math.ceil( entityData.timeToZero/( baseTimeToZero/daysToZero ) );

    io.sockets.connected[entityData.socketID].emit( 'user account data', { spendable: spendable, rt0: rt0, balance: entityData.balance, at0: rt0, dt0: daysToZero } );
  }
};

module.exports.payoutEmit = ( io ) => {

  EntityDB.find( { 'credentials.role': { $in: ['network', 'member' ] } }, {credentials: true, onChain: true} ).exec()
    .then( res => {
      for ( let i = 0; i < res.length; i++ ) {

        ( async () => {

          const entity = res[i];
          const date = new Date();
          const amount = systemInit.tokenDyn.payout;
          const timeSecondsUNIX = Number( Math.floor( Date.now() / 1000 ) );
          const burnR = exports.getBurned( entity, timeSecondsUNIX );
          const newRecipientBalance = burnR.burnedBalance + amount;
          const newTimeToZeroRecipient = Math.ceil( burnR.remainingTimeToZero * ( burnR.burnedBalance / newRecipientBalance ) + baseTimeToZero * ( amount / newRecipientBalance ) );

          const updateRecipient = function() {

            const a = new Promise( resolve => {  // update recipient onChain and stats
              EntityDB.findOneAndUpdate(
                { $and: [{'credentials.name': entity.credentials.name }, {'credentials.tag': entity.credentials.tag}] },
                {
                  $set: { 'onChain.balance': newRecipientBalance,
                    'onChain.lastMove': timeSecondsUNIX,
                    'onChain.timeToZero': newTimeToZeroRecipient,
                  }
                },
                {
                  new: true,
                },
                ( err ) => {
                  if ( err ) {return exports.handleMongoDBerror( 'Update Recipient in Database', err )}
                  resolve( 'recipient updated' );
                } // close callback
              ); // close findOneAndUpdate
            } ); // close Promise a

            const c = new Promise( resolve => {  // write to recipient tx history
              TxDB.findOneAndUpdate(
                { $and: [{name: entity.credentials.name }, {tag: entity.credentials.tag}] },
                { $push: { txHistory: {
                  date: date,
                  initiator: commName,
                  initiatorTag: systemInit.communityGovernance.commTag,
                  from: commName,
                  fromTag: systemInit.communityGovernance.commTag,
                  to: entity.credentials.name,
                  toTag: entity.credentials.tag,
                  for: systemInit.tokenDynDisplay.payoutTitle,
                  senderFee: 0,
                  burned: burnR.burnedDelta,
                  tt0: newTimeToZeroRecipient,
                  credit: amount,
                  debit: 0,
                  chainBalance: newRecipientBalance,
                }}},
                ( err ) => {
                  if ( err ) { return exports.handleMongoDBerror( 'Push Recipient-Tx to Database', err ) }
                  resolve( 'c resolved' );
                } // close callback
              ); // close findOneAndUpdate
            } ); // close Promise c

            return Promise.all( [a, c] );

          }; // close updateRecipient function

          await updateRecipient().then( () => {
            exports.updateEntityVisualizations( {
              socketID: entity.credentials.socketID,
              balance: newRecipientBalance,
              timeToZero: newTimeToZeroRecipient,
            }, io );
          } );

        } )();  // close async function
      }  // close loop over entities
    } )  // close .then
    .catch( err => { exports.handleMongoDBerror( 'Payout', err )} );
};

module.exports.getBurned  = ( entity, timeSecondsUNIX ) => {

  var a = timeSecondsUNIX - entity.onChain.lastMove, // elapsed time
    b = Math.ceil( entity.onChain.balance - entity.onChain.balance * ( a / entity.onChain.timeToZero ) ),
    c = entity.onChain.balance - b,
    d = entity.onChain.lastMove + entity.onChain.timeToZero - timeSecondsUNIX;

  return { burnedBlocks: a, burnedBalance: b, burnedDelta: c, remainingTimeToZero: d };
};

module.exports.constructUserName  = ( input ) => {

  var nameArray = input;

  if ( typeof input === 'string' ) {
    nameArray = input.trim().toLowerCase().split( ' ' );
  }

  return nameArray.map( function( string ) {
    if ( string.length > 2 && string.substr( 0, 2 ) == 'mc' ) {
      return string.charAt( 0 ).toUpperCase() + string.slice( 1, 2 ) + string.charAt( 2 ).toUpperCase() + string.slice( 3 );
    }
    if ( string.length > 3 && string.substr( 0, 3 ) == 'mac' ) {
      return string.charAt( 0 ).toUpperCase() + string.slice( 1, 3 ) + string.charAt( 3 ).toUpperCase() + string.slice( 4 );
    }
    else {
      return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
    }
  } ).join( ' ' );

};

module.exports.convertLinks = ( input ) => {

  // test text:
  // normal link www.apple.com and youtube link https://youtu.be/D5f78SK6EnI and vimeo link https://vimeo.com/319038756

  var text = input.replace( /www./gi, 'www.' ).replace( /http/gi, 'http' ).replace( /https/gi, 'https' ),
      linksFound = text.match( /(?:www|https?)[^\s]+/g ),
      aLink = [];

  if ( linksFound != null ) {

    for ( let i=0; i<linksFound.length; i++ ) {
      let replace = linksFound[i];
      if ( !( linksFound[i].match( /(http(s?)):\/\// ) ) ) { replace = 'http://' + linksFound[i] }
      let linkText = replace.split( '/' )[2];
      if ( linkText.substring( 0, 3 ) == 'www' ) { linkText = linkText.replace( 'www.', '' ) }
      if ( linkText.match( /youtu/ ) ) {
        // fluid width video: https://css-tricks.com/NetMag/FluidWidthVideo/Article-FluidWidthVideo.php
        let youtubeID = replace.split( '/' ).slice(-1)[0];
        aLink.push( '<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/' + youtubeID + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>' )
      }
      else if ( linkText.match( /vimeo/ ) ) {
        let vimeoID = replace.split( '/' ).slice(-1)[0];
        aLink.push( '<div class="video-wrapper"><iframe src="https://player.vimeo.com/video/' + vimeoID + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>' )
      }
      else {
        aLink.push( '<a href="' + replace + '" target="_blank">' + linkText + '</a>' );
      }
      text = text.split( linksFound[i] ).map(item => { return aLink[i].includes('iframe') ? item.trim() : item } ).join( aLink[i] );
    }
    return text;

  }
  else {
    return input;
  }
};

module.exports.handleMongoDBerror = ( req, err ) => {
  console.log( '(' + moment().format( 'D MMM YYYY h:mm a' ) + ') ' + 'MongoDB Error - ' + req + ' - ' + err );
};
