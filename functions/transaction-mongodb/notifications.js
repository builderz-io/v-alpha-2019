const systemInit = require( '../../systemInit' );

const i18n = require( '../../lang/' + systemInit.language );

const sign = '&#9673;';
const errorSign = '<i class="fas fa-exclamation-circle"></i>';


module.exports.errorNotification = ( socket, error ) => {

  socket.emit( 'chat error notification', { 'msg' :'<span class="alert-text">' + error + '</span>', 'symbol': errorSign, 'time': Date.now() } );

};

module.exports.misspelledNotification = ( socket, string ) => {

  socket.emit( 'chat error notification', { 'msg' :'<span class="alert-text">"' + string + '" ' + i18n.strErTx260 + '</span>', 'symbol': errorSign, 'time': Date.now() } );

};

module.exports.notifyAllEntities = ( txRoleEntities, amount, date, timeSecondsUNIX, _reference, txType, io ) => {

  const recipients = txRoleEntities.filter( obj => {return obj.roleInTx === 'recipient' } );
  const recipientNameMap = recipients.map( obj => {return obj.credentials.name } );
  var recipientNames = recipientNameMap.reduce( function( p, d, i ) {return p + ( i === recipientNameMap.length - 1 ? ' ' + i18n.strNfTx160 + ' ' : ', ' ) + d} ); // shout out to Bundit J. for this nice solution https://stackoverflow.com/questions/40328972/conditional-array-join-in-javascript
  var reference = _reference != '' ? i18n.str50010 + ' ' + _reference : '';
  const initiator = txRoleEntities[2].credentials.name;
  var sender = txRoleEntities.find( obj => {return obj.roleInTx === 'sender' } );
  const taxAmount = Math.ceil( ( amount * systemInit.tokenDyn.setTxFee ) * systemInit.taxPool.commTax ) * recipients.length;
  var entity;

  if ( recipients.length == 1 ) {
    recipientNames = '<span class="linked-entity" fullid="' + recipients[0].credentials.name + ' ' + recipients[0].credentials.tag + '">' + recipients[0].credentials.name + '</span>';
  }

  senderFormatted = '<span class="linked-entity" fullid="' + sender.credentials.name + ' ' + sender.credentials.tag + '">' + sender.credentials.name + '</span>'

  for ( let i = 0; i < txRoleEntities.length; i++ ) {

    entity = txRoleEntities[i];

    if ( entity.credentials.socketID != 'offline' ) {

      if ( entity.roleInTx === 'sender' ) {
        if ( txType === i18n.str50020 ) {
          io.sockets.connected[entity.credentials.socketID].emit( 'chat notification', { 'msg': '<span class="confirm-text">' + i18n.strNfTx120 + ' <span class="straight-number">' + amount + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx121 + ' ' + recipientNames + ' ' + reference + '</span>', 'symbol': sign, 'time': date } );
          //  socket.broadcast.to(res.credentials.socketID).emit('burn info message', {msg: '<span class="time">+ '+ burnedRecipientDelta + ' <span class="currency-unit">' + i18n.str60010 + '</span> were burned since your account has last been active.</span>', user: '&#9752;'});
        }
        else if ( txType === i18n.str50030 ) {
          io.sockets.connected[entity.credentials.socketID].emit( 'chat notification', { 'msg': '<span class="confirm-text">' + i18n.strNfTx119 + ' <span class="straight-number">' + amount + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx123 + ' ' + initiator + ' ' + i18n.strNfTx125 + ' ' + recipientNames + ' ' + reference + '</span>', 'symbol': sign, 'time': date } );
        }
        else {
          // io.sockets.connected[entity.credentials.socketID].emit( 'chat notification', { 'msg': '<span class="confirm-text">' + i18n.strNfTx140 + ' <span class="straight-number">' + amount + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx143 + ' ' + recipientNames + ' ' + i18n.strNfTx145 + reference + '</span>', 'symbol': sign, 'time': date } );
          io.sockets.connected[entity.credentials.socketID].emit( 'vivi message', '<span class="confirm-text">' + i18n.strNfTx140 + ' <span class="straight-number">' + amount + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx143 + ' ' + recipientNames + ' ' + i18n.strNfTx145 + reference + '</span>' );
          // <br/><span class="time">+ ' + txFee + ' <span class="currency-unit">' + i18n.str60010 + '</span> were burned with this transaction.</span>
        }
      }
      else if ( entity.roleInTx === 'recipient' ) {
        if ( txType === i18n.str50020 ) {
          io.sockets.connected[entity.credentials.socketID].emit( 'chat notification', { 'msg': '<span class="confirm-text">' + i18n.strNfTx130 + ' <span class="straight-number">' + amount + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx133 + ' ' + senderFormatted + ' ' + i18n.strNfTx111 + reference + '</span>', 'symbol': sign, 'time': date } );
          io.sockets.connected[entity.credentials.socketID].emit( 'transaction received' );
        }
        else if ( txType === i18n.str50030 ) {
          io.sockets.connected[entity.credentials.socketID].emit( 'chat notification', { 'msg': '<span class="confirm-text">' + i18n.strNfTx150 + ' ' + initiator + ' ' + i18n.strNfTx153 + ' <span class="straight-number">' + amount + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx133 + ' ' + senderFormatted + ' ' + i18n.strNfTx111 + reference + '</span>', 'symbol': sign, 'time': date } );
        }
        else {
          // io.sockets.connected[entity.credentials.socketID].emit( 'chat notification', { 'msg': '<span class="confirm-text">' + i18n.strNfTx110 + ' <span class="straight-number">' + amount + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx133 + ' ' + senderFormatted + ' ' + i18n.strNfTx111 + reference + '</span>', 'symbol': sign, 'time': date } );
          io.sockets.connected[entity.credentials.socketID].emit( 'vivi message', '<span class="confirm-text">' + i18n.strNfTx110 + ' <span class="straight-number">' + amount + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx133 + ' ' + senderFormatted + ' ' + i18n.strNfTx111 + reference + '</span>' );
          io.sockets.connected[entity.credentials.socketID].emit( 'transaction received' );

          let notificationObj = {
            name: entity.credentials.name,
            tag: entity.credentials.tag,
            // action: i18n.strNfTx110 + ' ' + i18n.str60010 + ' - ',
            action: i18n.strNOut110 + ' - ',
            network: systemInit.communityGovernance.commName,
            msg: i18n.strNOut110 + ' - ',
            teleMsg: i18n.strNOut110,
            // short version "You received V":
            // msg: i18n.strNfTx110 + ' ' + i18n.str60010,
            // teleMsg: i18n.strNfTx110 + ' ' + i18n.str60010
            // longer version with more transaction details revealed:
            // action: ' - ' + i18n.strNfTx110 + ' ' + amount + ' ' + i18n.str60010 + ' - ',
            // msg: ': ' + i18n.strNfTx110 + ' ' + amount + ' ' + i18n.str60010 + ' ' + i18n.strNfTx133 + ' ' + sender.credentials.name + ' ' + i18n.strNfTx111 + reference,
            // teleMsg: i18n.strNfTx110 + ' ' + amount + ' ' + i18n.str60010 + ' ' + i18n.strNfTx133 + ' ' + sender.credentials.name + ' ' + i18n.strNfTx111 + reference + '. ' + 'Your balance is now ' + ( entity.onChain.balance + amount ) + ' ' + i18n.str60010,
          };

          try {
            entity.social != undefined ? entity.social.email != undefined ? entity.social.email != '' ? entityMailer( notificationObj, entity.social.email ) : null : null : null;
          }
          catch (err) {
            console.log(err);
          }

          try {
            if ( systemInit.telegramModule.on ) {
              const telegramBot = require('../plugins/telegram/telegram-bot');
              entity.social != undefined ? entity.social.teleChatID != undefined ? entity.social.teleChatID != 0 ?  telegramBot.sendMessage( entity.social.teleChatID, notificationObj.teleMsg + ' - ' + notificationObj.network, { parse_mode: "Markdown" }) : null : null : null;
            }
          }
          catch (err) {
            console.log(err);
          }

        }
      }
      else if ( entity.roleInTx === 'initiator' ) {
        io.sockets.connected[entity.credentials.socketID].emit( 'chat notification', { 'msg': '<span class="confirm-text">' + i18n.strNfTx119 + ' <span class="straight-number">' + amount + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx123 + ' ' + i18n.strNfTx141 + ' ' + reference + ' (' + i18n.strNfTx133 + ' ' + senderFormatted + ' ' + i18n.strNfTx143 + ' ' + recipientNames + ')</span>', 'symbol': sign, 'time': date } );
      }
      else if ( entity.roleInTx === 'community' ) {
        if ( sender.credentials.name != entity.credentials.name && recipientNameMap.indexOf( entity.credentials.name ) == -1 ) {
          io.sockets.connected[entity.credentials.socketID].emit( 'chat notification', { 'msg': '<span class="confirm-text"><span class="straight-number">' + amount + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> (' + i18n.strNfTx133 + ' ' + senderFormatted + ' ' + i18n.strNfTx143 + ' ' + recipientNames + ')</span>', 'symbol': sign, 'time': date } );
        }
      }
      else if ( entity.roleInTx === 'taxpool' ) {
        io.sockets.connected[entity.credentials.socketID].emit( 'chat notification', { 'msg': '<span class="confirm-text">' + i18n.strNfTx110 + ' <span class="straight-number">' + taxAmount + '</span> <span class="currency-unit">' + i18n.str60010 + '</span> ' + i18n.strNfTx113 +  ' ' + senderFormatted + ' ' + i18n.strNfTx111 + '</span>', 'symbol': sign, 'time': date } ); // alternatively: + reference + '</span>'
        io.sockets.connected[entity.credentials.socketID].emit( 'transaction received' );
      }
      else {
        // do anything here?
      }
    } // close if socketID

  } // close for loop

};
