

function openPage() { // eslint-disable-line no-unused-vars
  $( '#textarea-form' ).hide();
  $( '#mn-btn-lb' ).hide();
  $( '#menu-btn' ).prop( 'checked', false );
  $( '#site-overlay' ).fadeToggle();
  $( '#site-overlay-2' ).fadeToggle();
  $( '#page' ).show();
}

function toLocal( date ) {
  // shout out to http://jsfiddle.net/simo/sapuhzmm/
  var local = new Date( date );
  // local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return local.toDateString() + ' - ' + local.toTimeString().slice( 0, 5 );
}

function sanitize( input ) { // eslint-disable-line no-unused-vars
  return input.trim().replace( /(?:\r\n|\r|\n)/g, ' ' ).replace( /<[^>]+>/g, '' );
}

function txHistoryTable( data ) { // eslint-disable-line no-unused-vars

  var cells, cellClasses;

  var table = document.createElement( 'TABLE' ),
    tableBody = document.createElement( 'TBODY' ),
    tableHead = document.createElement( 'THEAD' );

  var thCells = [/*'&nbsp;',*/ strTxPg120, '&nbsp;', strTxPg130, strTxPg140, strTxPg150, '<span class="currency-unit">' + str10001 + '</span>', '&nbsp;', strTxPg160];
  var thCellClasses = [/*'tx-type',*/ 'tx-date', 'tx-date-y hide-cell', 'tx-date-hh hide-cell', 'tx-from', 'tx-for', 'tx-credit align-right', 'tx-v-sign', 'tx-balance align-right'];
  var thRow = tableHead.insertRow( 0 );

  table.appendChild( tableHead );
  table.appendChild( tableBody );
  table.className = 'tx-history-table';

  if ( !( data[2] == 0 ) ) {
    thCells.push( strTxPg170 );
    thCellClasses.push( 'tx-fee align-right hide-cell' );
  }

  if ( data[3] ) {
    thCells.push( strTxPg180 );
    thCellClasses.push( 'tx-burned align-right hide-cell' );
  }

  if ( data[4] ) {
    thCells.push( data[5] );
    thCellClasses.push( 'tx-tt0 align-right hide-cell' );
  }

  thCells.push( strTxPg190 );
  thCellClasses.push( 'tx-initiator align-right hide-cell' );

  for ( let i = 0; i < thCells.length; i++ ) {
    const th = document.createElement( 'th' );
    th.innerHTML = thCells[i];
    th.className = thCellClasses[i];
    thRow.appendChild( th );
  }

  for ( let j = data[0].txHistory.length; j-- > 0; ) {

    if ( j >= 0 ) {

      const tx = data[0].txHistory[j],
        user = data[0].name,
        txD = toLocal( new Date( tx.date ) ).slice( 4, 10 ),
        txY = toLocal( new Date( tx.date ) ).slice( 11, 15 ),
        txT = toLocal( new Date( tx.date ) ).slice( 18, 24 );

      if ( !( user == tx.from ) ) {

        cells = [//'&#9673;',
          txD,
          txY,
          txT,
          tx.from,
          tx.for,
          tx.credit,
          '<span class="currency-unit">' + str10001 + '</span>',
          tx.chainBalance,
        ];

        cellClasses = [/*'tx-type confirm-text',*/ 'tx-date', 'tx-date-y hide-cell', 'tx-date-hh hide-cell', 'tx-from', 'tx-for', 'tx-credit straight-number green-text align-right', 'tx-v-sign green-text', 'tx-balance straight-number align-right'];

        if ( !( data[2] == 0 ) ) {
          cells.push( '0' );
          cellClasses.push( 'tx-fee straight-number align-right hide-cell' );
        }

        if ( data[3] ) {
          cells.push( tx.burned );
          cellClasses.push( 'tx-burned straight-number align-right hide-cell' );
        }

        if ( data[4] ) {
          cells.push( Math.floor( tx.tt0/data[1] ) );
          cellClasses.push( 'tx-tt0 straight-number align-right hide-cell' );
        }

        cells.push( tx.initiator );
        cellClasses.push( 'tx-initiator align-right hide-cell' );

      }
      else {

        cells = [//'&#9673;',
          txD,
          txY,
          txT,
          tx.to,
          tx.for,
          ( tx.debit * -1 ),
          '<span class="currency-unit">' + str10001 + '</span>',
          tx.chainBalance,
        ];

        cellClasses = [/*'tx-type alert-text',*/ 'tx-date', 'tx-date-y hide-cell', 'tx-date-hh hide-cell', 'tx-from', 'tx-for', 'tx-credit straight-number alert-text align-right', 'tx-v-sign alert-text', 'tx-balance straight-number align-right'];

        if ( !( data[2] == 0 ) ) {
          cells.push( tx.senderFee );
          cellClasses.push( 'tx-fee straight-number align-right hide-cell' );
        }

        if ( data[3] ) {
          cells.push( tx.burned );
          cellClasses.push( 'tx-burned straight-number align-right hide-cell' );
        }

        if ( data[4] ) {
          cells.push( Math.floor( tx.tt0/data[1] ) );
          cellClasses.push( 'tx-tt0 straight-number align-right hide-cell' );
        }

        cells.push( tx.initiator );
        cellClasses.push( 'tx-initiator align-right hide-cell' );

      }

      const tr = tableBody.insertRow( tableBody.rows.length );

      for ( let i = 0; i < cells.length; i++ ) {
        const td = tr.insertCell( i );
        td.className = cellClasses[i];
        td.innerHTML = cells[i];
      }
    }
  }
  return table;
}


function convertArrayOfObjectsToCSV( args ) {
  // credit to https://halistechnology.com/2015/05/28/use-javascript-to-export-your-data-as-csv/
  var result, ctr, keys, columnDelimiter, lineDelimiter, data;

  console.log( args.data );

  data = args.data.reverse() || null;
  if ( data == null || !data.length ) {
    return null;
  }

  columnDelimiter = args.columnDelimiter || ',';
  lineDelimiter = args.lineDelimiter || '\n';

  keys = Object.keys( data[0] );

  result = '';
  result += keys.join( columnDelimiter );
  result += lineDelimiter;

  data.forEach( function( item ) {
    ctr = 0;
    keys.forEach( function( key ) {
      if ( ctr > 0 ) {result += columnDelimiter}

      result += item[key];
      ctr++;
    } );
    result += lineDelimiter;
  } );

  return result;
}

function downloadCSV( args ) { // eslint-disable-line no-unused-vars
  var data, filename, link;

  var csv = convertArrayOfObjectsToCSV( {
    'data': args.data,
  } );
  if ( csv == null ) {return}

  filename = args.filename || 'export.csv';

  if ( !csv.match( /^data:text\/csv/i ) ) {
    csv = 'data:text/csv;charset=utf-8,' + csv;
  }
  data = encodeURI( csv );

  link = document.createElement( 'a' );
  link.setAttribute( 'href', data );
  link.setAttribute( 'download', filename );
  link.click();
}

function copyToClipboard( element ) { // eslint-disable-line no-unused-vars
  // https://codepen.io/shaikmaqsood/pen/XmydxJ
  var $temp = $( '<input>' );
  $( 'body' ).append( $temp );
  $temp.val( $( element ).text() ).select();
  document.execCommand( 'copy' );
  $temp.remove();
  $( '.copy-btn' ).html( strOfPg136 ).fadeOut( 600 );
  setTimeout( function() { $( '.copy-btn' ).html( strOfPg135 ).fadeIn( 300 ) }, 1000 );
}

function checkForTriggers( message ) { // eslint-disable-line no-unused-vars
  var triggers = commands.concat( commandsHlp, commandsEN, commandsDE, commandsKO, misspellingsEN );

  var messageParts = message.trim().split( ' ' );

  // in case user misses a blank, insert it // TODO: simplify and rework this functionality, also to work for all languages

  if ( messageParts[0].charAt( 0 ) === '+' || messageParts[0].charAt( 0 ) === '-' ) { messageParts.splice( 1, 0, messageParts[0].slice( 1 ) ); messageParts.splice( 0, 1, messageParts[0].charAt( 0 ) ) }
  // if (messageParts[0].substring(0,3) === 'pay') { messageParts.splice(0,0,messageParts[0].substring(0,3)); messageParts.splice(1,1,messageParts[1].substring(3,messageParts[1].length)); }
  // if (messageParts[0].substring(0,7) === 'request') { messageParts.splice(0,0,messageParts[0].substring(0,7)); messageParts.splice(1,1,messageParts[1].substring(7,messageParts[1].length)); }
  // // BUG: this is incompatible between German ("sende") and English ("send"): if (messageParts[0].substring(0,4) === 'send' || messageParts[0].substring(0,4) === 'plus' || messageParts[0].substring(0,4) === 'sned' || messageParts[0].substring(0,4) === 'sent' ) { messageParts.splice(0,0,messageParts[0].substring(0,4)); messageParts.splice(1,1,messageParts[1].substring(4,messageParts[1].length)); }

  if ( triggers.indexOf( messageParts[0].toLowerCase() ) != -1 ) {
    messageParts[0] = messageParts[0].toLowerCase();
    return messageParts;
  }
  else { return false }
}
