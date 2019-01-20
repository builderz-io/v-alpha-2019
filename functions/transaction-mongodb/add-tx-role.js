const systemInit = require( '../../systemInit' );
const i18n = require( '../../lang/' + systemInit.language );

module.exports.addTxRole = ( messageParts, entities ) => {

  var a, b, c, d;

  var entityObjects = JSON.parse( JSON.stringify( entities ) );

  var addedTxRoles = [];

  a = entityObjects[0];
  a['roleInTx'] = 'community';
  addedTxRoles.push( a );

  b = entityObjects[1];
  b['roleInTx'] = 'taxpool';
  addedTxRoles.push( b );

  c = entityObjects[2];

  if ( messageParts[0] === i18n.str50020 || messageParts[0] === '-' ) { // request
    c['roleInTx'] = 'recipient';
  }
  else if ( messageParts[0] === i18n.str50030 ) { // transfer
    c['roleInTx'] = 'initiator';
  }
  else { // regular
    c['roleInTx'] = 'sender';
  }
  addedTxRoles.push( c );

  for ( let i = 3; i < entityObjects.length; i++ ) {
    d = entityObjects[i];
    if ( d ) {
      if ( messageParts[0] === i18n.str50020 || messageParts[0] === '-' ) { // request

        d['roleInTx'] = 'sender';

      }
      else if ( messageParts[0] === i18n.str50030 ) { // transfer

        if ( ['pool', 'contribution'].includes( d.credentials.role ) ) {
          d['roleInTx'] = 'sender';
        }
        if ( ['member', 'network'].includes( d.credentials.role ) ) {
          d['roleInTx'] = 'recipient';
        }

      }
      else { // regular
        d['roleInTx'] = 'recipient';
      }
      addedTxRoles.push( d );

    } // end check object exists
  } // end for loop

  return addedTxRoles;

};
