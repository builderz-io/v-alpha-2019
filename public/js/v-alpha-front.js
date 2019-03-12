
( function( $ ) {

  // $( '#su-header-left' ).html( str10007 );
  $( '.currency-unit' ).html( str10001 );
  $( '.lifetime-unit' ).html( str20040 );
  $( '#textarea-text' ).attr( 'placeholder', str10210 );
  $( '#str20010' ).html( str20010 );
  $( '#str20020' ).html( str20020 );
  $( '#str20030' ).html( str20030 );
  $( '#str20040' ).html( str20040 );
  $( '#str20041' ).html( str20041 );
  $( '#menu-members' ).html( str20050 );
  $( '#menu-community' ).html( str20060 );
  $( '#menu-account' ).html( str20100 );
  $( '#about-btn' ).html( str20070 );
  $( '#pool-btn' ).html( str20080 );
  $( '#contribution-btn' ).html( str20085 );
  $( '#skills-btn' ).html( str20090 );
  $( '#jobs-btn' ).html( str20091 );
  $( '#places-btn' ).html( str20092 );
  $( '#all-map-btn' ).html( str20081 );
  $( '#profile-btn' ).html( str20110 );
  $( '#offline-btn' ).html( str20120 );
  $( '#tx-history-btn' ).html( str20130 );
  $( '#help-link' ).html( str20140 );
  $( '#report-link' ).html( str20150 );
  $( '#signup-button' ).html( str20160 );
  $( '#download-btn' ).html( str20170 );

  navigator.cookieEnabled ? Cookies.get( 'uPhrase' ) ? userReturning() : userNew() : $( '#system-message' ).html( str10010 );

  function userNew() {
    $( '#system-message' ).html( str10030 + '<br/><br/><a class="front-page-help" href="http://valueinstrument.org/alpha-help" target="_blank">' + str10035 + '</a>' );
    $( '#new-user-form' ).show();
    $( '#user-name' ).attr( 'placeholder', str10040 );
  }

  function userReturning() {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    $( '#system-message' ).html( str10020 );

    socket.emit( 'returning user', [Cookies.get( 'uPhrase' ), tz], function( callback ) {
      if ( callback === 1 ) {
        Cookies.remove( 'uPhrase' );
        $( '#system-message' ).html( str10050 );
        $( '#new-user-form' ).show();
        $( '#user-name' ).attr( 'placeholder', str10040 );

      }
      else if ( callback === 2 ) {
        loggedIn();
        socket.emit( 'analytics', 'RETURNED' );

        socket.emit( 'preload map files' );

      }
      else {
        $( '#system-message' ).html( str10060 );

      }
    } );
  }

  $( '#new-user-form' ).submit( function() {

    var formObj = {
      entry: sanitize( $( '#user-name' ).val() ),
      uPhrase: 'vx' + socket.id.replace( '_', 'a' ).replace( '-', '2' ).slice(0, 16),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    // brief initial checking of name being valid, before checking further on server side
    if ( $( '#user-name' ).val().length < 2 || $( '#user-name' ).val().indexOf( '#' ) != -1 || $( '#user-name' ).val().indexOf( '2121' ) != -1 ) {
      $( '#system-message' ).html( str10070 );
      return false;
    }

    socket.emit( 'new user', formObj, function( callback ) {
      if ( callback === 'not public' ) {
        $( '#system-message' ).html( 'Signup is not public. Please contact the community admin to get access.' );
      }
      else if ( callback === true ) {
        Cookies.set( 'uPhrase', formObj.uPhrase, { expires: 365 * 4 } );
        loggedIn();
          socket.emit( 'preload map files' );
      }
      else {
        $( '#system-message' ).html( str10070 );
      }
    } );

    $( '#user-name' ).val( '' );
    return false;
  } );

  socket.on( 'set cookies', function( uPhrase ) {
    Cookies.set( 'uPhrase', uPhrase, { expires: 365 * 4 } );
    userReturning();
  } );

  socket.on( 'chat message', function( data ) {
    if ( data.remove ) {
      $( '#time-' + data._id ).parent().parent().remove();
      return
    }
    $( '#messages-ul li:last-child' ).attr( 'class' ) === 'notification-container highlight' ? chatMsgNew( data ) :
      $( '#messages-ul li:last-child p:first-child span:first-child' ).html() === data.sender && $( '#messages-ul li:last-child p:first-child span:eq(1)' ).html() === data.senderTag ? chatMsgAppend( data ) :
        chatMsgNew( data );
    autoScroll();
  } );

  socket.on( 'vivi message', function( message ) {
     var data = {
       msg: message,
       sender: 'Vivi',
       senderTag: '#2121',
       time: Date.now()
     }
    $( '#messages-ul li:last-child' ).attr( 'class' ) === 'notification-container highlight' ? chatMsgNew( data ) :
      $( '#messages-ul li:last-child p:first-child span:first-child' ).html() === data.sender && $( '#messages-ul li:last-child p:first-child span:eq(1)' ).html() === data.senderTag ? chatMsgNew( data ) :
        chatMsgNew( data );
    autoScroll();
  } );

  socket.on( 'chat history', function( docs, callback ) {

    chatMsgHistoryClear();
    chatMsgNew( docs[0] );

    for ( let i = 1; i < docs.length; i++ ) {
      docs[i].sender === docs[i - 1].sender && docs[i].senderTag === docs[i - 1].senderTag ? chatMsgAppend( docs[i] ) : chatMsgNew( docs[i] );
    }

    autoScroll();

    return callback( true );

  } );

  socket.on( 'fixed notification', function( data ) {
    $( '#messages-ul' ).append( '<li class="notification-container highlight">' + data.msg + '</li>' ); // <span class="notification-symbol">' + data.symbol + '</span>    // <p class="time-right">' + toLocal(new Date(data.time)) + '</p>
    autoScroll();
  } );

  socket.on( 'chat notification', function( data ) {
    $( '#messages-ul' ).append( '<li id="notification' + Math.floor( Math.random() * 100000 ) + '" class="notification-container highlight" onclick="$(this).slideUp( 100, function() {})"><div class="notification-content">' + data.msg + '</div><span class="close-x"><i class="fas fa-times-circle close-x"></i></span></li>' ); // <span class="notification-symbol">' + data.symbol + '</span>    // <p class="time-right">' + toLocal(new Date(data.time)) + '</p>
    linkEntity('span', '.linked-entity', '');

    autoScroll();
  } );

  socket.on( 'chat error notification', function( data ) {
    $( '#messages-ul' ).append( '<li class="notification-container highlight" onclick="$(this).slideUp( 100, function() {})">' + data.msg + '<span class="close-x"><i class="fas fa-times-circle close-x"></i></span></li>' ); // <span class="notification-symbol">' + data.symbol + '</span>    // <p class="time-right">' + toLocal(new Date(data.time)) + '</p>
    autoScroll();
  } );

  socket.on( 'name in header', function( name ) {
    var fullId = name[0] + ' ' + name[1];
    setTimeout(function() {
      $( '#user-in-header' ).html( generateInitials( name[0] ) );
    }, 700)
    $( '#user-in-header' ).attr( 'fullid', fullId );
    $( '#header-svg' ).attr( 'fullid', fullId );
    $( '#profile-btn' ).attr( 'fullid', fullId );
    $( '#header-left' ).html( name[2] );
    headerLeft = name[2];
  } );

  socket.on( 'transaction received', function() {
    // playSound();
  } );

  /* socket.on('burn info message', function(msg){
     $('#messages').append($('<li>').html(msg.msg));
   }); */

  socket.on( 'user online list', function( users ) {
    $( '#user-online-list' ).html( users );
  } );


  socket.on( 'user account data', function( data ) {
    $( '#spendable' ).html( data.spendable );
    $( '#balance' ).html( data.balance );
    $( '#rt0' ).html( data.rt0 );
    $( '#at0' ).html( data.at0 );

    $( '#spendable-in-header' ).html( data.spendable + ' <span class="currency-unit">' + str10001 + '</span>' );

    $( '#chart' ).empty();
    svg( data );
    svgHeader( data );

  } );

  socket.on( 'disconnect', function() {

    closePage();
    $( '#site-overlay-2' ).hide();
    $( '#menu-btn' ).prop( 'checked', false );
    $( '#header-svg' ).off( 'click' );
    $( '#chart' ).off( 'click' );
    $( '#textarea-form' ).hide();
    $( '#mn-btn-lb' ).hide();
    $( '#select-menu' ).hide();
    $( '#spendable-in-header' ).hide();
    $( '#disconnected-notification' ).show().html( '<span class="alert-text">' + str10080 + '</span>' ).click( function() {
      location.reload();
    } );

    autoScroll();

  } );

  socket.on( 'nukeme', function() {

    Cookies.remove( 'uPhrase' );
    $( 'body' ).html( '<div id="system-message">' + str10090 + '</div>' );

  } );

  socket.on( 'account disabled', function() {

    Cookies.remove( 'uPhrase' );
    $( 'body' ).html( '<div id="system-message">' + str10100 + '</div>' );

  } );

  socket.on( 'tx history', function( data ) {
    $( '#header-left' ).html( strTxPg110 );
    $( '.page-title' ).show().html( data[0].name );
    $( '.page-pipe' ).html( txHistoryTable( data ) );
    linkEntity('span', '.linked-entity', '');
  } );

  socket.on( 'download tx history', function( data ) {
    downloadCSV( {
      data: data[0].txHistory,
      filename: 'Transaction-History-' + data[0].name + '-' + toLocal( Date.now() ).replace( /\s/g, '-' ) + '.csv',
    } );
  } );

  // Menu/Submenus - shoutout to https://github.com/christophery/pushy/

  var siteOverlay = $( '#site-overlay' ), // eslint-disable-line vars-on-top
  siteOverlay2 = $( '#site-overlay-2' ),
  submenuClass = '.pushy-submenu',
  submenuOpenClass = 'pushy-submenu-open',
  submenuClosedClass = 'pushy-submenu-closed';

  function toggleSubmenu() {
    //hide submenu by default
    $( submenuClass ).addClass( submenuClosedClass );

    $( submenuClass ).on( 'click', function() {

      linkEntity();

      var selected = $( this );

      if( selected.hasClass( submenuClosedClass ) ) {
        //hide opened submenus
        $( submenuClass ).addClass( submenuClosedClass ).removeClass( submenuOpenClass );
        //show submenu
        selected.removeClass( submenuClosedClass ).addClass( submenuOpenClass );
      }
      else {
        //hide submenu
        selected.addClass( submenuClosedClass ).removeClass( submenuOpenClass );
      }
    } );
  }

  function toggleOverlay() {
    if ( $( '#site-overlay' ).is( ':visible' ) ) {
      $( '#site-overlay' ).fadeToggle();
      $( '#site-overlay-2' ).hide();
    }
    else {
      $( '#site-overlay' ).delay( 300 ).fadeToggle();
      $( '#site-overlay-2' ).delay( 300 ).fadeToggle();
    }
  }

  //checks if 3d transforms are supported removing the modernizr dependency
  var cssTransforms3d = ( function csstransforms3d() { // eslint-disable-line vars-on-top
    var el = document.createElement( 'p' ),
    supported = false,
    transforms = {
      webkitTransform:'-webkit-transform',
      OTransform:'-o-transform',
      msTransform:'-ms-transform',
      MozTransform:'-moz-transform',
      transform:'transform'
    };

    if( document.body !== null ) {
      // Add it to the body to get the computed style
      document.body.insertBefore( el, null );

      for ( const t in transforms ) {
        if( el.style[t] !== undefined ) {
          el.style[t] = 'translate3d(1px,1px,1px)';
          supported = window.getComputedStyle( el ).getPropertyValue( transforms[t] );
        }
      }

      document.body.removeChild( el );

      return ( supported !== undefined && supported.length > 0 && supported !== 'none' );
    }
    else {
      return false;
    }
  } )();

  if ( cssTransforms3d ) {
    //toggle submenu
    toggleSubmenu();

    //close menu when clicking site overlay
    siteOverlay.on( 'click', function() {
      $( '#menu-btn' ).prop( 'checked', false );
      toggleOverlay();
    } );
    siteOverlay2.on( 'click', function() {
      $( '#menu-btn' ).prop( 'checked', false );
      toggleOverlay();
    } );

  }
  else {
    //add css class to body
    $( 'body' ).addClass( 'no-csstransforms3d' );

    //fixes IE scrollbar issue
    // container.css({"overflow-x": "hidden"});

    //keep track of menu state (open/close)
    // var opened = false;

    //toggle submenu
    toggleSubmenu();

    //close menu when clicking site overlay
    siteOverlay.on( 'click', function() {
      $( '#menu-btn' ).prop( 'checked', false );
      toggleOverlay();
    } );
    siteOverlay2.on( 'click', function() {
      $( '#menu-btn' ).prop( 'checked', false );
      toggleOverlay();
    } );
  }

  // Pages

  $( '#tx-history-btn, #header-svg, #chart' ).click( function() {
    openPage();
    socket.emit( 'tx history' );
  } );

  $( '#download-btn' ).click( function() { socket.emit( 'download tx history' ) } );
  $( '#profile-btn' ).click( function( e ) { openEditableProfile( e ) } );
  $( '#user-in-header' ).click( function( e ) { openEditableProfile( e ) } );
  $( '#about-btn' ).click( function() { openCommunity() } );
  $( '#header-left, #network-logo' ).click( function() { openCommunity() } );
  $( '#offline-btn' ).click( function() {
    openPage();
    $( '#header-left' ).html( strOfPg110 );
    $( '.page-title' ).show().html( strOfPg120 );
    $( '.page-pipe' ).html( '<p class="notification-container highlight">' + strOfPg130 + '<br/><br/><span class="alert-text alert-bgrd" id="uPhrase-signout">' + Cookies.get( 'uPhrase' ) + '</span><button class="copy-btn strong-weight" onclick="copyToClipboard(' + "'#uPhrase-signout'" + ')">' + strOfPg135 + '</button><br/><br/></p><button id="go-offline">' + strOfPg140 + '</button><button id="cancel-offline">' + strOfPg150 + '</button>' ); // eslint-disable-line quotes

    $( '#go-offline' ).click( function() {
      socket.emit( 'analytics', 'DISCONNECT' );
      socket.disconnect();
      $( 'body' ).html( '<div id="system-message">' + strOfPg160 + '</div>' );
      Cookies.remove( 'uPhrase' );
    } );

    $( '#cancel-offline' ).click( function() {
      closePage();
    } );
  } );

  // close pages
  $( '#close-page, #top-close' ).click( function() {
    closePage();
  } );

  $( '#close-profile-page, #top-profile-close' ).click( function() {
    closeProfilePage();
  } );

  $( '#close-map-page, #top-map-close' ).click( function() {
    closeMapPage();
  } );


  // Textarea
  $( '#textarea-form' )
    .one( 'focus.autoExpand', 'textarea.autoExpand', function() {
      // shout out to Yair Even Or
      var savedValue = this.value;
      this.value = '';
      this.baseScrollHeight = this.scrollHeight;
      this.value = savedValue;
    } )
    .on( 'input.autoExpand', 'textarea.autoExpand', function() {
      // shout out to Yair Even Or
      var minRows = this.getAttribute( 'data-min-rows' ) | 1, rows;
      this.rows = minRows;
      rows = Math.ceil( ( this.scrollHeight - this.baseScrollHeight ) / 16 );
      this.rows = minRows + rows;
    } );


  $( '#textarea-form' ).submit( function() {
    var message = sanitize( $( '#textarea-text' ).val() );

    if ( message.indexOf( 'vx' ) > -1 ) {
      // possibly a unique phrase was accidentally entered, therefore prohibit sending
      clearTextarea();
      return;
    }

    if ( message.match( /[a-zA-Z0-9+]/ ) === null ) {
      // no valid message was entered, so nothing happens
      clearTextarea();
    }

    else if ( ['sen ', 'snd ', 'sed '].indexOf( message.substr( 0, 4 ) ) >= 0 ) {
      socket.emit( 'possibly misspelled trigger', message.substr( 0, 3 ), function( callback ) {
        if ( callback ) { clearTextarea() }
      } );
    }

    else {   // does message include trigger words?

      messageParts = checkForTriggers( message );

      if ( !messageParts ) { // if message is good and no trigger word was detected, it is not a transaction, therefore just send message into chat
        socket.emit( 'chat message', message );
        socket.emit( 'analytics', 'send-message' );
        clearTextarea();
      }
      else {

        if ( commandsHelp.indexOf( messageParts[0] ) != -1 ) {   // does message include trigger word "help"?
          $( '.notification-container' ).remove();
          $( '#messages-ul' ).append( '<li class="notification-container highlight" onclick="$(this).slideUp( 100, function() {})">' + str10110 + '<span class="close-x"><i class="fas fa-times-circle close-x"></i></span></li>' );
          autoScroll();
          clearTextarea();
        }
        else if ( commandsSearch.indexOf( messageParts[0] ) != -1 ) {   // does message include trigger word "search"?
          findAndDisplayEntity( message );
        }
        else if ( messageParts[0] === 'nukeme' ) {
          socket.emit( 'nukeme' );
        }
        else if ( messageParts[0] === 'crashapp' ) {
          socket.emit( 'crash app', function( callback ) {
            if ( !callback ) { $( '#textarea-text' ).val( 'App in production, cannot be crashed' ) }
          } );
        }
        else if ( messageParts[0] === 'analyse' ||  messageParts[0] === 'a!' ) {
          socket.emit( 'analyse', [messageParts, Cookies.get( 'uPhrase' )], function( callback ) {

            displayAnalysis( callback );

          } );
          clearTextarea();
        }
        else if ( messageParts[0] === 'verify' ) {
          socket.emit( 'verify', [messageParts, Cookies.get( 'uPhrase' )] );
          clearTextarea();
        }
        else if ( messageParts[0] === 'makeadmin' ) {
          socket.emit( 'makeadmin', [messageParts, Cookies.get( 'uPhrase' )] );
          clearTextarea();
        }
        else if ( messageParts[0] === 'revokeadmin' ) {
          socket.emit( 'revokeadmin', [messageParts, Cookies.get( 'uPhrase' )] );
          clearTextarea();
        }
        else if ( messageParts[0] === 'disable' ) {
          socket.emit( 'disable', [messageParts, Cookies.get( 'uPhrase' )] );
          clearTextarea();
        }
        else if ( messageParts[0] === 'enable' ) {
          socket.emit( 'enable', [messageParts, Cookies.get( 'uPhrase' )] );
          clearTextarea();
        }
        else {
          socket.emit( 'test transaction', [messageParts, Cookies.get( 'uPhrase' )], function( callback ) {
            if ( callback ) {
              socket.emit( 'analytics', 'test-transaction' );
              confirmTx( callback );
            }
            else { // nothing here
            }
          } );
        }
      }
    }

    return false;
  } );


  // document listeners


  $( document ).ready( function() {

    $( '#menu-btn' ).change( function() {
      toggleOverlay();
      clearTextarea();
    } );

    // disallow back button
    window.history.pushState( null, '', window.location.href );
    window.onpopstate = function() {
      window.history.pushState( null, '', window.location.href );
    };
  } );

  document.addEventListener( 'keydown', function( e ) {
    var key = window.event ? e.keyCode : e.which;
    // esc
    if ( key == 27 ) {
      closePage();
      closeProfilePage();
      // $( '#textarea-text' ).blur().val(''); // TODO: only when autoComplete or confirm tx is not active
    }
  } );

  $( document ).click( function( e ) {

    const eId = e.target.attributes.id ? e.target.attributes.id.nodeValue : e.target.attributes.class ? e.target.attributes.class.nodeValue : 'undefined';

    if ( ['mid-bar', 'top-bar', 'low-bar', 'mn-btn-lb'].indexOf( eId ) == -1 ) {
      socket.emit( 'analytics', eId );
    }

  } );


  $( window ).resize( function() {

    if ( $( window ).height() < 450 ) {

      $( '#select-menu' ).height( $( window ).height() - 78 );
    }
    else {
      $( '#select-menu' ).css('height','');
    }

  } );


}( jQuery ) );
