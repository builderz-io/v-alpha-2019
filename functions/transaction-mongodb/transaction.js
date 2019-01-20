
const systemInit = require( '../../systemInit' );
const i18n = require( '../../lang/' + systemInit.language );

const findEntities = require( '../../functions/find-entities' );
const addTxRole = require( '../../functions/transaction-mongodb/add-tx-role' );
const checkValid = require( '../../functions/transaction-mongodb/check-tx-validity' );
const updateEntities = require( '../../functions/transaction-mongodb/update-entities' );
const notifications = require( '../../functions/transaction-mongodb/notifications' );


exports = module.exports = function( io ) {

  io.sockets.on( 'connection', function( socket ) {

    socket.on( 'possibly misspelled trigger', function( string, callback ) {
      notifications.misspelledNotification( socket, string );
      callback( false );
    } );

    socket.on( 'transaction', function( data, callback ) {

      const messageParts = data[0];
      const uPhrase = data[1];

      const date = Date.now(),
        timeSecondsUNIX = Number( Math.floor( date / 1000 ) ),
        forIndex = messageParts.indexOf( i18n.str50010 );
      var reference = '';

      if ( forIndex != -1 ) {
        reference = messageParts.slice( forIndex + 1, messageParts.length ).join( ' ' ).trim();
        messageParts.splice( forIndex, messageParts.length - forIndex );
      }

      const amount = messageParts.filter( function( item ) { return Number( parseInt( item ) == item ) } ).reduce( function( acc, val ) { return Number( acc ) + Number( val ) }, 0 );

      findEntities.findAllEntities( messageParts, uPhrase )
        .then( entities => {

          const txRoleEntities = addTxRole.addTxRole( messageParts, entities );

          const checkValidity = checkValid.checkTxValidity( txRoleEntities, amount, timeSecondsUNIX, reference, messageParts[0] );

          if ( checkValidity != true ) {
            notifications.errorNotification( socket, checkValidity );
            return callback( false );
          }
          else {
            updateEntities.updateAllEntities( txRoleEntities, amount, date, timeSecondsUNIX, reference, messageParts[0], io );
            notifications.notifyAllEntities( txRoleEntities, amount, date, timeSecondsUNIX, reference, messageParts[0], io );
            return callback( true );
          } // close else (valid transaction)

        } )
        .catch( ( err ) => {
          console.log( 'Issue in transaction - ' + err );
        } );

    } );  // close socket.on('transaction')

  } ); // close io.sockets.on

}; // close module.exports
