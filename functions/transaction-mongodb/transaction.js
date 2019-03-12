
const systemInit = require( '../../systemInit' );
const i18n = require( '../../lang/' + systemInit.language );

const findEntities = require( '../../functions/find-entities' );
const addTxRole = require( '../../functions/transaction-mongodb/add-tx-role' );
const checkValid = require( '../../functions/transaction-mongodb/check-tx-validity' );
const updateEntities = require( '../../functions/transaction-mongodb/update-entities' );
const notifications = require( '../../functions/transaction-mongodb/notifications' );

const constructTx = require('../../functions/tools').constructTx;


exports = module.exports = function( io ) {

  io.sockets.on( 'connection', function( socket ) {

    socket.on( 'possibly misspelled trigger', function( string, callback ) {
      notifications.misspelledNotification( socket, string );
      callback( false );
    } );

    socket.on( 'test transaction', function( data, callback ) {

      const messageParts = data[0];
      const uPhrase = data[1];

      findEntities.findAllEntities( messageParts, uPhrase )
        .then( entities => {
          const txData = constructTx( messageParts );
          const txRoleEntities = addTxRole.addTxRole( messageParts, entities );
          const checkValidity = checkValid.checkTxValidity( txRoleEntities, txData.amount, txData.timeSecondsUNIX, txData.reference, messageParts[0] );

          if ( checkValidity != true ) {
            notifications.errorNotification( socket, checkValidity );
            return callback( false );
          }
          else {
            return callback( [txData.amount, txData.reference, messageParts[0]] );
          } // close else (valid transaction)

        } )
        .catch( ( err ) => {
          console.log( 'Issue when testing transaction - ' + err );
        } );

    } );  // close socket.on('test transaction')

    socket.on( 'transaction', function( data, callback ) {

      const messageParts = data[0];
      const uPhrase = data[1];

      findEntities.findAllEntities( messageParts, uPhrase )
        .then( entities => {

          const txData = constructTx( messageParts );
          const txRoleEntities = addTxRole.addTxRole( messageParts, entities );

          updateEntities.updateAllEntities( txRoleEntities, txData.amount, txData.date, txData.timeSecondsUNIX, txData.reference, messageParts[0], io );
          notifications.notifyAllEntities( txRoleEntities, txData.amount, txData.date, txData.timeSecondsUNIX, txData.reference, messageParts[0], io );
          return callback( true );

        } )
        .catch( ( err ) => {
          console.log( 'Issue in transaction - ' + err );
        } );

    } );  // close socket.on('transaction')

  } ); // close io.sockets.on

}; // close module.exports
