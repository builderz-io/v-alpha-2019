/* eslint no-unused-vars: 0 */

function chatMsgAppend( data ) {
  $( '#messages-ul li:last-child' ).append( '<p class="message-p">' + data.msg + '</p>' );
}

function chatMsgNew( data ) {
  $( '#messages-ul' ).append( '<li class="message-container"></li>' );
  $( '#messages-ul li:last-child' ).html( '<p class="message-sender"><span id="sender-' + data._id + '" fullid="' + data.sender + ' ' + data.senderTag + '" class="strong-weight">' + data.sender + '</span> <span class="user-tag">' + data.senderTag + '</span> <span class="time" id="time-' + data._id + '" msgid="' + data._id + '" onclick="chatMsgDeleteConfirm(this)"> ' + toLocal( new Date( data.time ) ) + '</span></p><p class="message-p">' + data.msg + '</p>' );
  // $( '#messages-ul li:last-child' ).attr( 'msgID', data._id );
  linkEntity( 'span', '#sender-', data._id );
}

function chatMsgDelete( id ) {
  socket.emit( 'delete chat message', id, function( callback ) {
    if ( callback ) {
      $( '#time-' + id ).text( 'can delete' );
    }
    else {
      $( '#time-' + id ).text( 'can NOT delete' );
    }
  } );
}

function chatMsgDeleteConfirm( element ) {
  $( '#' + element.attributes.id.value ).text( str30070 ).css( 'color', 'red' ).attr( 'onclick', 'chatMsgDelete(' + '\'' + element.attributes.msgid.value + '\'' + ')' );
}

function chatMsgHistoryClear() {
  $( '#messages-ul' ).html( '' );
}

function checkForTriggers( message ) {
  var triggers = commands.concat( commandsHelp, commandsSearch, commandsEN, commandsDE, commandsKO, misspellingsEN, misspellingsDE );

  var checkParts = message.trim().split( ' ' );

  // in case user misses a blank, insert it // TODO: simplify and rework this functionality, also to work for all languages

  if ( checkParts[0].charAt( 0 ) === '+' || checkParts[0].charAt( 0 ) === '-' ) { checkParts.splice( 1, 0, checkParts[0].slice( 1 ) ); checkParts.splice( 0, 1, checkParts[0].charAt( 0 ) ) }
  // if (checkParts[0].substring(0,3) === 'pay') { checkParts.splice(0,0,checkParts[0].substring(0,3)); checkParts.splice(1,1,checkParts[1].substring(3,checkParts[1].length)); }
  // if (checkParts[0].substring(0,7) === 'request') { checkParts.splice(0,0,checkParts[0].substring(0,7)); checkParts.splice(1,1,checkParts[1].substring(7,checkParts[1].length)); }
  // // BUG: this is incompatible between German ("sende") and English ("send"): if (checkParts[0].substring(0,4) === 'send' || checkParts[0].substring(0,4) === 'plus' || checkParts[0].substring(0,4) === 'sned' || checkParts[0].substring(0,4) === 'sent' ) { checkParts.splice(0,0,checkParts[0].substring(0,4)); checkParts.splice(1,1,checkParts[1].substring(4,checkParts[1].length)); }

  if ( triggers.indexOf( checkParts[0].toLowerCase() ) != -1 ) {
    checkParts[0] = checkParts[0].toLowerCase();
    return checkParts;
  }
  else { return false }
}

function confirmTx( callback ) {

  const sc = document.createElement( 'div' );
  sc.id = 'confirm-tx';

  const rect = document.getElementById( 'textarea-text' ).getBoundingClientRect();
  sc.style.left = Math.round( rect.left + ( window.pageXOffset || document.documentElement.scrollLeft ) ) + 'px';
  sc.style.bottom = $( '#textarea-text' ).height() + 25 + 30 + 'px';
  sc.style.width = Math.round( rect.right - rect.left ) + 'px'; // outerWidth
  sc.innerHTML = '<div id="confirm-tx-msg">' + callback[2].charAt( 0 ).toUpperCase() + callback[2].slice( 1 ) + ' <span class="strong-weight">' + callback[0] + '</span>' + ' <span class="currency-unit">' + str10001 + '</span>' + '?</div>' + '<button id="confirm-tx-btn" onclick="confirmTxFinal( socket, messageParts )">yes</button>'; // eslint-disable-line quotes

  sc.addEventListener( 'keydown', function( e ) {
    var key = window.event ? e.keyCode : e.which;
    // esc
    if ( key == 27 ) {
      $( '#confirm-tx' ).remove();
      e.stopPropagation();
    }
  } );

  document.body.appendChild( sc );
  document.getElementById( 'confirm-tx-btn' ).focus();
}

function confirmTxFinal( socket, messageParts ) {
  $( '#confirm-tx' ).remove();
  clearTextarea();
  socket.emit( 'transaction', [messageParts, Cookies.get( 'uPhrase' )], function( callback ) {
    if ( callback ) {
      socket.emit( 'analytics', 'confirm-transaction' );
      messageParts = [];
    }
  } );
}

function convertArrayOfObjectsToCSV( args ) {
  // credit to https://halistechnology.com/2015/05/28/use-javascript-to-export-your-data-as-csv/
  var result, ctr, keys, columnDelimiter, lineDelimiter, data;

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

function copyHiddenPhrase( input ) {
  var $temp = $( '<input>' );
  $( 'body' ).append( $temp );
  $temp.val( input ).select();
  document.execCommand( 'copy' );
  $temp.remove();
  $( '#user-name' ).focus();
}

function copyToClipboard( element ) {
  // https://codepen.io/shaikmaqsood/pen/XmydxJ
  var $temp = $( '<input>' );
  $( 'body' ).append( $temp );
  $temp.val( $( element ).text() ).select();
  document.execCommand( 'copy' );
  $temp.remove();
  $( '.copy-btn' ).html( strOfPg136 ).fadeOut( 600 );
  setTimeout( function() { $( '.copy-btn' ).html( strOfPg135 ).fadeIn( 300 ) }, 1000 );
}

function downloadCSV( args ) {
  var data, filename, link;

  var csv = convertArrayOfObjectsToCSV( {
    data: args.data,
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

function displayAnalysis( data ) {

  var menuBtnPressed = data.clickHistory.filter( item => {return item.a == 'menu-btn'} ).length;
  var locBtnPressed = data.clickHistory.filter( item => {return item.a == 'skills-btn'} ).length;
  var sessions = data.clickHistory.filter( item => {return item.a == 'RETURNED' || item.a == 'REGISTERED'} ).length;

  chatMsgNew( {msg: '', time: Date.now(), sender: data.name, senderTag: data.tag } );
  chatMsgAppend( {msg: 'Sessions analysed: ' + sessions } );
  chatMsgAppend( {msg: 'Menu opened: ' + menuBtnPressed } );
  chatMsgAppend( {msg: 'Skills opened: ' + locBtnPressed + ' (' + ( locBtnPressed / menuBtnPressed * 100 ).toFixed( 2 ) + ' %)'} );

  data.clickHistory.slice().reverse().forEach( click => {return chatMsgAppend( {msg: click.a + ' (' + ( click.d ? click.d : '-' ) + ')'} )} );

}

function findAndDisplayEntity( message ) {

  const messageParts = message.split( ' ' );

  socket.emit( 'find entity', messageParts, function( callback ) {
    if ( callback ) {
      openProfilePage();
      $( '#header-left' ).html( 'View' );
      $( '.profile-page-title' ).html( callback[4] );
      $( '.profile-page-pipe' ).html( profileTable( callback[0] ) );
      $( '#profile-page-description' ).show().html( callback[2] );
      $( '#profile-page-send-funds' ).show().html( callback[3] );

      if ( callback[1] != false ) {
        $( '.profile-page-pipe' ).append( '</br>' + '<span class="strong-weight">' + str20131 + '</span>' );
        $( '.profile-page-pipe' ).append( txHistoryTable( [callback[1]] ) );
      }

    }
    else {
      openProfilePage();
      $( '#header-left' ).html( str20110 );
      $( '.profile-page-pipe' ).html( str30010 );
    }
  } );
}

function findNow( userName, userTag ) {
  $( '.mapboxgl-popup' ).hide();
  findAndDisplayEntity( userName + ' ' + userTag );
  $( '#menu-btn' ).prop( 'checked', false );
  $( '#site-overlay' ).hide();
  $( '#site-overlay-2' ).hide();
}

function fundNow( userName, userTag ) {
  var fill = 'send ' + userName + ' ' + userTag + ' 10';
  $( '#close-page' ).click();
  $( '#close-profile-page' ).click();
  $( '#close-map-page' ).click();
  $( '#textarea-text' ).attr( 'rows', Math.ceil( fill.length / Math.floor( $( '#textarea-text' ).width() / 10 ) + 1 ).toString() );
  $( '#textarea-text' ).val( fill );
  $( '#textarea-text' ).focus();
}

function generateInitials( name ) {
  const initials = name.split( ' ' );
  const first = initials[0].charAt( 0 );
  const firstConsonant = initials[0].substr( 1 ).split( '' ).filter( letter => { return ['a', 'e', 'i', 'o', 'u'].indexOf( letter ) == -1 } )[0].toUpperCase();
  const second = initials[1] ? initials[1].charAt( 0 ) : firstConsonant;
  return first + second;
}

function initAutocomplete() {
  var autocomplete = new google.maps.places.Autocomplete(
    /** @type {!HTMLInputElement} */( document.getElementById( 'offer-location' ) ),
    {types: ['geocode']} );

  autocomplete.addListener( 'place_changed', function() {
    $( '#offer-location' ).css( 'border', '1px solid lightgray' );
    var place = autocomplete.getPlace();
    document.getElementById( 'offer-location-lat' ).value = place.geometry.location.lat().toFixed( 5 );
    document.getElementById( 'offer-location-lng' ).value = place.geometry.location.lng().toFixed( 5 );
  } );
}

function initAutocompleteOnProfile() {
  var autocomplete = new google.maps.places.Autocomplete(
    /** @type {!HTMLInputElement} */ ( document.getElementById( 'member-loc' ) ),
    {types: ['geocode']} );

  autocomplete.addListener( 'place_changed', function() {
    // $('#member-loc').css('border','1px solid lightgray');
    var place = autocomplete.getPlace();
    document.getElementById( 'member-location-lat' ).value = place.geometry.location.lat().toFixed( 5 );
    document.getElementById( 'member-location-lng' ).value = place.geometry.location.lng().toFixed( 5 );
  } );
}

function linkEntity( element, prefix, randElementId, unbind ) {
  return $( prefix + randElementId ).click( function( e ) {
    e.stopPropagation();
    const find = $( this ).closest( element ).attr( 'fullid' );
    findAndDisplayEntity( find );
    unbind ? $( '.linked-entity' ).unbind( 'click' ) : null;
    socket.emit( 'analytics', 'linked-' + find.replace( / /g, '-' ) );
  } );
}

function openEditableProfile( e ) {

  var idToSend;

  if ( e.target ) {
    idToSend = e.target.attributes.fullid.nodeValue;
  }
  else {
    idToSend = e[0].attributes.fullid.nodeValue;
  }

  openPage();
  socket.emit( 'editable profile', [ Cookies.get( 'uPhrase' ), idToSend ], function( data ) {

    $( '#header-left' ).html( str20010 );
    $( '#name-in-header' ).hide();
    $( '#page-description' ).show().html( data[1] );
    $( '#page-send-funds' ).show().html( data[2] );
    $( '.page-pipe' ).html( profileTable( data[0] ) );
    $( '.page-title' ).show().html( data[0][data[0].length - 2][1] );

    $( '.page-content' ).animate( { scrollTop: 0 }, 500 );

    $( '.disable-entity' ).click( function( e ) {

      closePage();
      closeProfilePage();
      closeMapPage();

      var id = e.target.id;

      socket.emit( 'disable entity by user', id, function( callback ) {
        if ( callback ) {
          $( '#' + id ).replaceWith( strPfPg110 );

        }
        else {
          $( '#' + id ).replaceWith( strPfPg120 );
        }
      } );

      return false;
    } );

    $( '.pause-entity' ).click( function( e ) {

      closePage();
      closeProfilePage();
      closeMapPage();

      var id = e.target.id;

      socket.emit( 'pause entity by user', id, function( callback ) {
        if ( callback ) {
          // $( '#' + id ).replaceWith( strPfPg110 );
        }
        else {
          // $( '#' + id ).replaceWith( strPfPg120 );
        }
      } );

      return false;
    } );

    $( '.user-profile-editable' ).on( 'click', function() {
      // https://codepen.io/talleyran/pen/YJOeVg

      $( '#close-page' ).hide();

      $( '.list-group' ).find( 'p' ).show();
      $( '.list-group' ).find( 'form' ).hide();

      if ( $( this ).closest( 'li' ).find( 'form' ).length == 0 ) {
        var dBfield = $( this ).closest( 'li' ).find( 'p' ).attr( 'dBfield' );
        if ( !( dBfield == 'properties.description' ) ) {
          $( '.page-content' ).animate( { scrollTop: $( '.page-content' ).scrollTop() + $( this ).offset().top - 73}, 200 );
        }
        var entityToUpdate = $( '#member-fullid' ).val();
        var placeholderStr = '';
        var linkFill = '';
        var form, value;

        if ( dBfield == 'social.fb' ) {
          placeholderStr = str30030 + ' ' + 'john_smith';
          linkFill = 'https://facebook.com/';
        }
        else if ( dBfield == 'social.tw' ) {
          placeholderStr = str30030 + ' ' + 'john_smith';
          linkFill = 'https://twitter.com/';
        }
        else if ( dBfield == 'social.tele' ) {
          placeholderStr = str30030 + ' ' + 'john_smith';
          linkFill = 'https://t.me/';
        }
        else if ( dBfield == 'social.web' ) {
          placeholderStr = str30030 + ' ' + 'smith.com';
          linkFill = 'https://';
        }
        // else if ( dBfield == 'languages' ) {
        //   placeholderStr = str20180;
        // }
        else if ( dBfield == 'properties.price' ) {
          placeholderStr = str20190;
          linkFill = '';
        }
        else if ( dBfield == 'properties.unit' ) {
          placeholderStr = 'Unit';
          linkFill = '';
        }
        else {
          placeholderStr = str30030 + ' ' + 'john@smith.com';
          linkFill = 'mailto:';
        }

        var divAppend = '<div class="input-group-append"><button type="button" class="btn btn-secondary cancel"><i id="cancel-edit" class="fas fa-times-circle"></i></button><button type="button" class="btn btn-success ok"><i id="submit-edit" class="fas fa-check-circle"></i></button></div>';

        if ( dBfield == 'properties.location' ) {
          placeholderStr = str30030 + ' ' + str20200;
          linkFill = 'https://www.google.de/search?q=';
          form = '<form class="usernames-submit-form"><div class="input-group"><input id="member-loc" class="form-control" placeholder="' + placeholderStr + '">' + divAppend + '</div></form>';

          $.getScript( 'https://maps.googleapis.com/maps/api/js?key=AIzaSyD2MU7foORS25ayBrpV28DoZiHfXoCQvts&libraries=places&callback=initAutocompleteOnProfile' );

        }
        else if ( dBfield == 'properties.description' ) {
          placeholderStr = str30060;
          linkFill = '';
          form = '<form class="usernames-submit-form"><div class="form-group"><textarea id="member-description" rows="1" class="form-control" placeholder="' + placeholderStr + '"></textarea>' + divAppend + '</div></form>';

        }
        else {
          form = '<form class="usernames-submit-form"><div class="input-group"><input placeholder="' + placeholderStr + '" class="form-control">' + divAppend + '</div></form>';
        }

        form = $( form );

        form.find( 'button.cancel' ).on( 'click', function() {
          $( '#close-page' ).show();
          $( this ).closest( 'li' ).find( 'a' ).attr( 'href', linkFill + value ).text( value ).show();
          $( this ).closest( 'li' ).find( 'p' ).show();
          $( this ).closest( 'form' ).hide();
          $( '#member-loc' ).removeClass( 'form-control-warn' ).val( '' ).attr( 'placeholder', placeholderStr );
        } );

        form.find( 'button.ok' ).on( 'click', function() {
          value = $( this ).closest( 'form' ).find( 'input,select,textarea' ).first().val().trim();


          if ( dBfield == 'properties.location' ) {

            if ( value == '' ) {
              socket.emit( 'update entity profile location', ['remove', entityToUpdate] );
              form.find( 'button.cancel' ).trigger( 'click' );
              return;
            }

            var data = {
              location: $( this ).closest( 'form' ).find( 'input,select,textarea' ).first().val(),
              lat: $( '#member-location-lat' ).val(),
              lng: $( '#member-location-lng' ).val()
            };

            if ( !$( '#member-location-lat' ).val() ) {
              value = '';
              $( '#member-loc' ).addClass( 'form-control-warn' ).val( '' ).attr( 'placeholder', str30050 );
            }
            else {
              socket.emit( 'update entity profile location', [data, entityToUpdate] );
              form.find( 'button.cancel' ).trigger( 'click' );
            }

          }
          else {
            socket.emit( 'update entity profile', [ value, entityToUpdate, dBfield ] );
            form.find( 'button.cancel' ).trigger( 'click' );
          }

        } ); // close ok button
        form.insertAfter( this );

      }
      $( this ).closest( 'ul' ).find( 'form' ).hide();
      $( this ).closest( 'ul' ).find( 'p' ).show();
      $( this ).closest( 'li' ).find( 'form' ).show();
      $( this ).closest( 'li' ).find( 'a' ).hide();
      $( this ).closest( 'li' ).find( 'input,select,textarea' ).first().val( $( this ).closest( 'li' ).find( 'a' ).text() ).focus().select();
      $( this ).hide();

      $( '.usernames-submit-form' ).submit( function( e ) {
        e.preventDefault();
        // $( '.btn-success' ).trigger( "click" );
      } );
    } );
  } );
}

function playSound() {
  // this is a beautiful sound composition by philipeachille

  if ( $( 'script[src="js/pizzicato.min.js"]' ).length == 0 ) {

    var load = ( function() { // eslint-disable-line  vars-on-top
      // shout out to https://davidwalsh.name/javascript-loader
      function _load( tag ) {
        return function( url ) {
          // This promise will be used by Promise.all to determine success or failure
          return new Promise( function( resolve, reject ) {
            var element = document.createElement( tag );
            var parent = 'body';
            var attr = 'src';

            // Important success and error for the promise
            element.onload = function() {
              resolve( url );
            };
            element.onerror = function() {
              reject( url );
            };

            // Need to set different attributes depending on tag type
            switch( tag ) {
            case 'script':
              element.async = true;
              break;
            case 'link':
              element.type = 'text/css';
              element.rel = 'stylesheet';
              attr = 'href';
              parent = 'head';
            }

            // Inject into document to kick off loading
            element[attr] = url;
            document[parent].appendChild( element );
          } );
        };
      }

      return {
        css: _load( 'link' ),
        js: _load( 'script' ),
        img: _load( 'img' )
      };
    } )();

    // Usage:  Load different file types with one callback
    Promise.all( [
      load.js( 'js/pizzicato.min.js' ),

    ] ).then( function() {

      var sineWave1 = new Pizzicato.Sound( {
        source: 'wave',
        options: { type: 'sine', frequency: 880, volume: 0.27 }
      } );
      var sineWave2 = new Pizzicato.Sound( {
        source: 'wave',
        options: { type: 'sine', frequency: 440, volume: 0.9 }
      } );
      var sineWave3 = new Pizzicato.Sound( {
        source: 'wave',
        options: { type: 'sine', frequency: 659.255, volume: 0.62 }
      } );

      var reverb = new Pizzicato.Effects.Reverb( {
        time: 0.6,
        decay: 1.2,
        reverse: false,
        mix: 0.9
      } );
      var tremolo = new Pizzicato.Effects.Tremolo( {
        speed: 7,
        depth: 0.8,
        mix: 0.3
      } );

      var group = new Pizzicato.Group( [sineWave1, sineWave2, sineWave3] );

      sineWave1.attack = 0.3;
      sineWave2.attack = 0.3;
      sineWave1.release = 2;
      sineWave2.release = 2;

      group.addEffect( reverb );
      group.addEffect( tremolo );

      group.play();

      setTimeout( function() { group.stop() }, 100 );

    } ).catch( function() {
      console.log( 'Could not play sound' );
    } );

  }

}

function profileTable( data ) {
  var cells, cellClasses, tr;
  var table = document.createElement( 'TABLE' ),
    tableBody = document.createElement( 'TBODY' ),
    tableHead = document.createElement( 'THEAD' );
  table.appendChild( tableHead );
  table.appendChild( tableBody );

  for ( let j = data.length; j-- > 0; ) {
    if ( j >= 0 ) {
      cells = [ data[j][0], data[j][1] ];
      cellClasses = ['stat-td', 'data-td align-right'];
      tr = tableBody.insertRow( tableBody.rows.length );

      for ( let i=0; i<cells.length; i++ ) {
        const td = tr.insertCell( i );
        td.className = cellClasses[i];
        td.innerHTML = cells[i];
      }
    }
  }
  return table;
}

function sanitize( input ) {
  return input.trim().replace( /(?:\r\n|\r|\n)/g, ' ' ).replace( /<[^>]+>/g, '' );
}

function svg( data ) {
  // https://openstudio.redhat.com/scratch-made-svg-donut-pie-charts-in-html5/
  // http://tutorials.jenkov.com/svg/svg-transformation.html
  // var data = {spendable: 91, rt0: 80, balance: 123, at0: 119, dt0: 120}

  var percent = Math.floor( ( data.rt0 / data.dt0 ) * 100 );

  var numberDisplay = data.spendable > 19999 ? Math.floor( data.spendable / 1000 ) + 'k' : data.spendable;

  var svg = '<svg id="menu-history-svg" width="100%" height="100%" viewBox="0 0 36 36" class="donut">  \
  <circle id="menu-history-svg-crcl1" cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#000" stroke-width="2.5"></circle>  \
  <circle id="menu-history-svg-crcl2" cx="18" cy="18" r="14.3239569771994436" fill="transparent" stroke="#000" stroke-width="1.5"></circle>  \
  <circle id="menu-history-svg-crcl3" stroke-dasharray="' + percent + ' ' + ( 100 - percent ) + '" transform ="rotate(-90, 18, 18) translate(0, 36) scale(1, -1)" stroke-dashoffset="-200" cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#6352B9" stroke-width="2.5"></circle>  \
  <circle id="menu-history-svg-crcl4" stroke-dasharray="' + ( percent * 0.9 ) + ' ' + ( 100 - percent * 0.9 ) + '" transform ="rotate(-90, 18, 18) translate(0, 36) scale(1, -1)" stroke-dashoffset="-200" cx="18" cy="18" r="14.3239569771994436" fill="transparent" stroke="#4e3e81" stroke-width="1.5"></circle>  \
  <g class="chart-text"> \
  <text id="menu-history-svg-txt" x="50%" y="51%" class="chart-number"> \
  ' + numberDisplay + ' \
  </text> \
  </g> \
  </svg>';

  $( '#chart' ).html( svg );

}

function svgHeader( data ) {
  // https://openstudio.redhat.com/scratch-made-svg-donut-pie-charts-in-html5/
  // http://tutorials.jenkov.com/svg/svg-transformation.html
  // var data = {spendable: 9999, rt0: 80, balance: 123, at0: 119, dt0: 120}

  var percent = Math.floor( ( data.rt0 / data.dt0 ) * 100 );

  var numberDisplay = data.spendable > 19999 ? Math.floor( data.spendable / 1000 ) + 'k' : data.spendable;

  var svg = '<svg id="header-history-svg" width="55px" height="86%" viewBox="0 0 36 36" class="donut">  \
  <circle id="header-history-svg-crcl" stroke-dasharray="' + percent + ' ' + ( 100 - percent ) + '" transform ="rotate(-90, 18, 18) translate(0, 36) scale(1, -1)" stroke-dashoffset="-200" cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#6352B9" stroke-width="2.7"></circle>  \
  <g class="chart-text"> \
  <text id="header-history-svg-txt" x="50%" y="56%" class="header-chart-number"> \
  ' + numberDisplay + ' \
  </text> \
  </g> \
  </svg>';

  $( '#header-svg' ).html( svg );

}

function toLocal( date ) {
  // shout out to http://jsfiddle.net/simo/sapuhzmm/
  var local = new Date( date );
  // local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return local.toDateString() + ' - ' + local.toTimeString().slice( 0, 5 );
}

function txHistoryTable( data ) {

  var cells, cellClasses;

  var tableWrapper = document.createElement( 'DIV' ),
    table = document.createElement( 'TABLE' ),
    tableBody = document.createElement( 'TBODY' ),
    tableHead = document.createElement( 'THEAD' );

  var thCells = [/*'&nbsp;',*/ strTxPg140, strTxPg150, '<span class="currency-unit">' + str10001 + '</span>', '&nbsp;', strTxPg160 ];
  var thCellClasses = [/*'tx-type',*/ 'tx-from', 'tx-for', 'tx-credit align-right', 'tx-v-sign', 'tx-balance align-right' ];
  var thRow = tableHead.insertRow( 0 );

  table.appendChild( tableHead );
  table.appendChild( tableBody );
  table.className = 'tx-history-table';
  tableWrapper.className = 'tx-history-table-wrapper';

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
  thCellClasses.push( 'tx-initiator hide-cell' );

  thCells.push( ... [strTxPg120, '&nbsp;', '&nbsp;' /* strTxPg130 */ ] );
  thCellClasses.push( ... ['tx-date hide-cell', 'tx-date-y hide-cell', 'tx-date-hh hide-cell'] );

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
          '<span class="linked-entity" fullid="' + tx.from + ' ' + tx.fromTag + '">' + tx.from + '</span>',
          tx.for,
          tx.credit,
          '<span class="currency-unit">' + str10001 + '</span>',
          tx.chainBalance,
        ];

        cellClasses = [/*'tx-type confirm-text',*/ 'tx-from', 'tx-for', 'tx-credit straight-number green-text align-right', 'tx-v-sign green-text', 'tx-balance straight-number align-right'];

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

        cells.push( '<span class="linked-entity" fullid="' + tx.initiator + ' ' + tx.initiatorTag + '">' + tx.initiator + '</span>' );
        cellClasses.push( 'tx-initiator hide-cell' );

        cells.push( ... [ txD, txY, txT ] );
        cellClasses.push( ... ['tx-date hide-cell', 'tx-date-y hide-cell', 'tx-date-hh hide-cell'] );

      }
      else {

        cells = [//'&#9673;',
          '<span class="linked-entity" fullid="' + tx.to + ' ' + tx.toTag + '">' + tx.to + '</span>',
          tx.for,
          ( tx.debit * -1 ),
          '<span class="currency-unit">' + str10001 + '</span>',
          tx.chainBalance,
        ];

        cellClasses = [/*'tx-type alert-text',*/ 'tx-from', 'tx-for', 'tx-credit straight-number alert-text align-right', 'tx-v-sign alert-text', 'tx-balance straight-number align-right' ];

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

        cells.push( '<span class="linked-entity" fullid="' + tx.initiator + ' ' + tx.initiatorTag + '">' + tx.initiator + '</span>' );
        cellClasses.push( 'tx-initiator hide-cell' );

        cells.push( ... [ txD, txY, txT ] );
        cellClasses.push( ... [ 'tx-date hide-cell', 'tx-date-y hide-cell', 'tx-date-hh hide-cell' ] );

      }

      const tr = tableBody.insertRow( tableBody.rows.length );

      for ( let i = 0; i < cells.length; i++ ) {
        const td = tr.insertCell( i );
        td.className = cellClasses[i];
        td.innerHTML = cells[i];
      }
    }
  }

  tableWrapper.appendChild( table );
  return tableWrapper;
}

function uuidv4() {
  // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  return ( [1e7]+-1e3+-4e3+-8e3+-1e11 ).replace( /[018]/g, c => {return ( c ^ crypto.getRandomValues( new Uint8Array( 1 ) )[0] & 15 >> c / 4 ).toString( 16 )}
  );
}
