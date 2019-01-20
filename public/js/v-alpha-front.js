
( function( $ ) {

  var socket = io();

  var headerLeft = '';

  $( 'title' ).html( 'Value Instrument Alpha' );
  $( '#su-header-left' ).html( 'Value Instrument' );
  $( '#su-header-right' ).show().html( 'Welcome' );
  $( '.currency-unit' ).html( str10001 );
  $( '#textarea-text' ).attr( 'placeholder', str10210 );
  $( '#str20010' ).html( str20010 );
  $( '#str20020' ).html( str20020 );
  $( '#str20030' ).html( str20030 );
  $( '#str20040' ).html( str20040 );
  $( '#str20041' ).html( str20041 );
  $( '#first-link' ).html( str20050 );
  $( '#comm-profile' ).html( str20060 );
  $( '#about-btn' ).html( str20070 );
  $( '#pool-btn' ).html( str20080 );
  $( '#contribution-btn' ).html( str20085 );
  $( '#location-btn' ).html( str20090 );
  $( '#account-profile' ).html( str20100 );
  $( '#profile-btn' ).html( str20110 );
  $( '#offline-btn' ).html( str20120 );
  $( '#tx-history-btn' ).html( str20130 );
  $( '#help-link' ).html( str20140 );
  $( '#report-link' ).html( str20150 );
  $( '#signup-button' ).html( str20160 );
  $( '#download-btn' ).html( str20170 );


  navigator.cookieEnabled ? Cookies.get( 'uPhrase' ) ? returningUser() : newUser() : $( '#system-message' ).html( str10010 );

  function newUser() {

    $( '#system-message' ).html( str10030 + '<br/><br/><a class="front-page-help" href="http://valueinstrument.org/alpha-help" target="_blank">' + str10035 + '</a>' );
    $( '#new-user-form' ).show();
    $( '#user-name' ).attr( 'placeholder', str10040 );
  }

  function returningUser() {
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

      }
      else {
        $( '#system-message' ).html( str10060 );

      }
    } );
  }

  $( '#new-user-form' ).submit( function() {

    var formObj = {
      'entry': sanitize( $( '#user-name' ).val() ),
      'uPhrase': 'vx' + socket.id.replace( '_', 'a' ).replace( '-', '2' ),
      'tz': Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    // brief initial checking of name being valid, before checking further on server side
    if ( $( '#user-name' ).val().length < 2 ) {return false}

    socket.emit( 'new user', formObj, function( callback ) {
      if ( callback === 'not public' ) {
        $( '#system-message' ).html( 'Signup is not public. Please contact the community admin to get access.' );
      }
      else if ( callback === true ) {
        Cookies.set( 'uPhrase', formObj.uPhrase, { 'expires': 365 * 4 } );
        loggedIn();
      }
      else {
        $( '#system-message' ).html( str10070 );
      }
    } );

    $( '#user-name' ).val( '' );
    return false;
  } );

  function loggedIn() {
    $( '#new-user-form' ).hide();
    $( '#system-message' ).hide();
    $( '#signup-screen' ).hide();
    $( '#signup-header' ).hide();
    $( '#container' ).show();
    $( '#textarea-form' ).show();
    $( '#textarea-text' ).focus();
    $( '#mn-btn-lb' ).show();
    autoScroll();
  }

  socket.on( 'set cookies', function( uPhrase ) {
    Cookies.set( 'uPhrase', uPhrase, { 'expires': 365 * 4 } );
    returningUser();
  } );

  socket.on( 'chat message', function( data ) {
    $( '#messages-ul li:last-child' ).attr( 'class' ) === 'notification-container highlight' ? newChatMessage( data ) :
      $( '#messages-ul li:last-child p:first-child span:first-child' ).html() === data.sender && $( '#messages-ul li:last-child p:first-child span:eq(1)' ).html() === data.senderTag ? appendChatMessage( data ) :
        newChatMessage( data );
    autoScroll();
  } );

  function newChatMessage( data ) {
    $( '#messages-ul' ).append( '<li class="message-container"></li>' );
    $( '#messages-ul li:last-child' ).html( '<p class="message-sender"><span class="strong-weight">' + data.sender + '</span> <span class="user-tag">' + data.senderTag + '</span> <span class="time"> ' + toLocal( new Date( data.time ) ) + '</span></p><p class="message-p">' + data.msg + '</p>' );
  }

  function appendChatMessage( data ) {
    $( '#messages-ul li:last-child' ).append( '<p class="message-p">' + data.msg + '</p>' );
  }

  socket.on( 'chat history', function( docs, callback ) {

    $( '#messages-ul' ).html( '' );

    newChatMessage( docs[0] );

    for ( let i = 1; i < docs.length; i++ ) {
      docs[i].sender === docs[i - 1].sender && docs[i].senderTag === docs[i - 1].senderTag ? appendChatMessage( docs[i] ) : newChatMessage( docs[i] );
    }

    autoScroll();

    return callback( true );

  } );

  socket.on( 'welcome new user', function( data ) {

    $( '#messages-ul' ).append( '<li class="notification-container highlight">' + data.msg + '</li>' ); // <span class="notification-symbol">' + data.symbol + '</span>    // <p class="time-right">' + toLocal(new Date(data.time)) + '</p>
    autoScroll();

  } );

  socket.on( 'chat notification', function( data ) {
    $( '#messages-ul' ).append( '<li class="notification-container highlight" onclick="$(this).slideUp( 100, function() {})">' + data.msg + '<span class="close-x"><i class="fas fa-times-circle close-x"></i></span></li>' ); // <span class="notification-symbol">' + data.symbol + '</span>    // <p class="time-right">' + toLocal(new Date(data.time)) + '</p>
    autoScroll();
  } );

  socket.on( 'chat error notification', function( data ) {
    $( '#messages-ul' ).append( '<li class="notification-container highlight" onclick="$(this).slideUp( 100, function() {})">' + data.msg + '<span class="close-x"><i class="fas fa-times-circle close-x"></i></span></li>' ); // <span class="notification-symbol">' + data.symbol + '</span>    // <p class="time-right">' + toLocal(new Date(data.time)) + '</p>
    autoScroll();
  } );

  socket.on( 'name in header', function( name ) {
    var fullId = name[0] + ' ' + name[1];
    $( '#user-in-header' ).html( name[0] );
    $( '#user-in-header' ).attr( 'fullid', fullId );
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
    headerSvg( data );

  } );

  function svg( data ) {
    // https://openstudio.redhat.com/scratch-made-svg-donut-pie-charts-in-html5/
    // http://tutorials.jenkov.com/svg/svg-transformation.html
    // var data = {spendable: 91, rt0: 80, balance: 123, at0: 119, dt0: 120}

    var percent = Math.floor( ( data.rt0 / data.dt0 ) * 100 );

    var numberDisplay = data.spendable > 19999 ? Math.floor( data.spendable / 1000 ) + 'k' : data.spendable;

    var svg = '<svg width="100%" height="100%" viewBox="0 0 36 36" class="donut">  \
                  <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#000" stroke-width="2.5"></circle>  \
                  <circle cx="18" cy="18" r="14.3239569771994436" fill="transparent" stroke="#000" stroke-width="1.5"></circle>  \
                  <circle stroke-dasharray="' + percent + ' ' + ( 100 - percent ) + '" transform ="rotate(-90, 18, 18) translate(0, 36) scale(1, -1)" stroke-dashoffset="-200" cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#6352B9" stroke-width="2.5"></circle>  \
                  <circle stroke-dasharray="' + ( percent * 0.9 ) + ' ' + ( 100 - percent * 0.9 ) + '" transform ="rotate(-90, 18, 18) translate(0, 36) scale(1, -1)" stroke-dashoffset="-200" cx="18" cy="18" r="14.3239569771994436" fill="transparent" stroke="#4e3e81" stroke-width="1.5"></circle>  \
                  <g class="chart-text"> \
                      <text x="50%" y="51%" class="chart-number"> \
                        ' + numberDisplay + ' \
                      </text> \
                  </g> \
                </svg>';

    $( '#chart' ).html( svg );

  }

  function headerSvg( data ) {
    // https://openstudio.redhat.com/scratch-made-svg-donut-pie-charts-in-html5/
    // http://tutorials.jenkov.com/svg/svg-transformation.html
    // var data = {spendable: 9999, rt0: 80, balance: 123, at0: 119, dt0: 120}

    var percent = Math.floor( ( data.rt0 / data.dt0 ) * 100 );

    var numberDisplay = data.spendable > 19999 ? Math.floor( data.spendable / 1000 ) + 'k' : data.spendable;

    var svg = '<svg width="55px" height="86%" viewBox="0 0 36 36" class="donut">  \
                  <circle stroke-dasharray="' + percent + ' ' + ( 100 - percent ) + '" transform ="rotate(-90, 18, 18) translate(0, 36) scale(1, -1)" stroke-dashoffset="-200" cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#6352B9" stroke-width="2.7"></circle>  \
                  <g class="chart-text"> \
                      <text x="50%" y="56%" class="header-chart-number"> \
                        ' + numberDisplay + ' \
                      </text> \
                  </g> \
                </svg>';

    $( '#header-svg' ).html( svg );

  }

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

  function autoScroll() {
    $( '#container' ).animate( {'scrollTop': $( '#container' ).get( 0 ).scrollHeight}, 500 );
  }

  /*
  function playSound() { // this is a beautiful sound composition by philipeachille

    if ($('script[src="js/pizzicato.min.js"]').length == 0) {

      var load = (function() {
        // shout out to https://davidwalsh.name/javascript-loader
        function _load(tag) {
          return function(url) {
            // This promise will be used by Promise.all to determine success or failure
            return new Promise(function(resolve, reject) {
              var element = document.createElement(tag);
              var parent = 'body';
              var attr = 'src';

              // Important success and error for the promise
              element.onload = function() {
                resolve(url);
              };
              element.onerror = function() {
                reject(url);
              };

              // Need to set different attributes depending on tag type
              switch(tag) {
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
              document[parent].appendChild(element);
            });
          };
        }

        return {
          css: _load('link'),
          js: _load('script'),
          img: _load('img')
        };
      })();

      // Usage:  Load different file types with one callback
      Promise.all([
        load.js('js/pizzicato.min.js'),

      ]).then(function() {

        var sineWave1 = new Pizzicato.Sound({
          source: 'wave',
          options: { type: 'sine', frequency: 880, volume: 0.27 }
        });
        var sineWave2 = new Pizzicato.Sound({
          source: 'wave',
          options: { type: 'sine', frequency: 440, volume: 0.9 }
        });
        var sineWave3 = new Pizzicato.Sound({
          source: 'wave',
          options: { type: 'sine', frequency: 659.255, volume: 0.62 }
        });

        var reverb = new Pizzicato.Effects.Reverb({
          time: 0.6,
          decay: 1.2,
          reverse: false,
          mix: 0.9
        });
        var tremolo = new Pizzicato.Effects.Tremolo({
          speed: 7,
          depth: 0.8,
          mix: 0.3
        });
        sineWave1.attack = 0.3;
        sineWave2.attack = 0.3;
        sineWave1.release = 2;
        sineWave2.release = 2;

        var group = new Pizzicato.Group([sineWave1, sineWave2, sineWave3]);

        group.addEffect(reverb);
        group.addEffect(tremolo);

        group.play();

        setTimeout(function() { group.stop(); }, 100);


      }).catch(function() {
        console.log('Could not play sound');
      });

    }

  }
  */

  // Core Pages

  $( '#tx-history-btn' ).click( function() {
    openPage();
    socket.emit( 'tx history' );
  } );

  $( '#download-btn' ).click( function() {
    socket.emit( 'download tx history' );
  } );

  $( '#header-svg' ).on( 'click', function() {
    openPage();
    socket.emit( 'tx history' );
  } );

  $( '#chart' ).on( 'click', function() {
    openPage();
    socket.emit( 'tx history' );
  } );

  socket.on( 'tx history', function( data ) {
    $( '#header-left' ).html( strTxPg110 );
    $( '.page-pipe' ).html( txHistoryTable( data ) );
  } );

  socket.on( 'download tx history', function( data ) {
    downloadCSV( {
      'data': data[0].txHistory,
      'filename': 'Transaction-History-' + data[0].name + '-' + toLocal( Date.now() ).replace( /\s/g, '-' ) + '.csv',
    } );
  } );

  $( '#profile-btn' ).click( function() {
    openPage();
    socket.emit( 'profile' );
  } );

  socket.on( 'profile', function( data ) {

    var cells, cellClasses, tr;
    var table = document.createElement( 'TABLE' ),
      tableBody = document.createElement( 'TBODY' ),
      tableHead = document.createElement( 'THEAD' );

    table.appendChild( tableHead );
    table.appendChild( tableBody );

    for ( let j = data.length; j-- > 0; ) {
      if ( j >= 0 ) {
        cells = [ data[j][0], data[j][1] ];
        cellClasses = ['profile-tr', 'profile-data-tr align-right'];
        tr = tableBody.insertRow( tableBody.rows.length );

        for ( let i=0; i<cells.length; i++ ) {
          const td = tr.insertCell( i );
          td.className = cellClasses[i];
          td.innerHTML = cells[i];
        }
      }
    }

    $( '#header-left' ).html( 'Your Account' );
    $( '.page-pipe' ).html( table );

    $( '.disable-loc' ).click( function( e ) {

      var id = e.target.id;

      socket.emit( 'disable location', id, function( callback ) {
        if ( callback ) {
          $( '#' + id ).replaceWith( strPfPg110 );

        }
        else {
          $( '#' + id ).replaceWith( strPfPg120 );
        }
      } );

      return false;
    } );

    $( '.disable-pool' ).click( function( e ) {

      var id = e.target.id;

      socket.emit( 'disable pool', id, function( callback ) {
        if ( callback ) {
          $( '#' + id ).replaceWith( strPfPg110 );

        }
        else {
          $( '#' + id ).replaceWith( strPfPg120 );
        }
      } );

      return false;
    } );

    $( '.disable-qc' ).click( function( e ) {

      var id = e.target.id;

      socket.emit( 'disable contribution', id, function( callback ) {
        if ( callback ) {
          $( '#' + id ).replaceWith( strPfPg110 );

        }
        else {
          $( '#' + id ).replaceWith( strPfPg120 );
        }
      } );

      return false;
    } );


  } );

  $( '#about-btn' ).click( function() {
    openPage();
    socket.emit( 'about community' );
  } );

  socket.on( 'about community', function( data ) {

    var cells, cellClasses, tr;
    var table = document.createElement( 'TABLE' ),
      tableBody = document.createElement( 'TBODY' ),
      tableHead = document.createElement( 'THEAD' );
    table.appendChild( tableHead );
    table.appendChild( tableBody );

    for ( let j = data.length; j-- > 0; ) {

      if ( j >= 0 ) {

        cells = [ data[j][0], data[j][1] ];
        cellClasses = ['comm-stats-tr', 'comm-data-tr align-right'];
        tr = tableBody.insertRow( tableBody.rows.length );

        for ( let i=0; i<cells.length; i++ ) {
          const td = tr.insertCell( i );
          td.className = cellClasses[i];
          td.innerHTML = cells[i];
        }
      }
    }

    $( '#header-left' ).html( strCmPg110 );
    $( '.page-pipe' ).html( table );
  } );

  $( '#offline-btn' ).click( function() {
    openPage();
    $( '#header-left' ).html( strOfPg110 );
    $( '.page-title' ).html( strOfPg120 );
    $( '.page-pipe' ).html( '<p class="notification-container highlight">' + strOfPg130 + '<br/><br/><span class="alert-text alert-bgrd" id="uPhrase-signout">' + Cookies.get( 'uPhrase' ) + '</span><button class="copy-btn strong-weight" onclick="copyToClipboard(' + '"#uPhrase-signout"' + ')">' + strOfPg135 + '</button><br/><br/></p><button id="go-offline">' + strOfPg140 + '</button><button id="cancel-offline">' + strOfPg150 + '</button>' );
  } );

  // go offline
  $( document ).on( 'click', '#go-offline', function() {
    socket.disconnect();
    $( 'body' ).html( '<div id="system-message">' + strOfPg160 + '</div>' );
    Cookies.remove( 'uPhrase' );
  } );

  // close page
  $( '.fa-times-circle' ).click( function() {
    closePage();
  } );

  $( document ).on( 'click', '#cancel-offline', function() {
    closePage();
  } );

  $( '#top-right-close' ).on( 'click', function() {
    closePage();
  } );

  function closePage() {
    $( '#page' ).hide();
    $( '#site-overlay' ).hide();
    $( '#site-overlay-2' ).hide();
    $( '#textarea-form' ).show();
    $( '#mn-btn-lb' ).show();
    $( '#header-left' ).html( headerLeft );
    $( '.page-title' ).html( '' );
    $( '.page-pipe' ).html( '' );
  }

  // disallow back button
  $( document ).ready( function() {
    window.history.pushState( null, '', window.location.href );
    window.onpopstate = function() {
      window.history.pushState( null, '', window.location.href );
    };
  } );


  // Textareas - applied globally on all textareas with the "autoExpand" class - shout out to Yair Even Or
  $( document )
    .one( 'focus.autoExpand', 'textarea.autoExpand', function() {
      var savedValue = this.value;
      this.value = '';
      this.baseScrollHeight = this.scrollHeight;
      this.value = savedValue;
    } )
    .on( 'input.autoExpand', 'textarea.autoExpand', function() {
      var minRows = this.getAttribute( 'data-min-rows' )|0, rows;
      this.rows = minRows;
      rows = Math.ceil( ( this.scrollHeight - this.baseScrollHeight ) / 16 );
      this.rows = minRows + rows;
    } );


  $( '#textarea-form' ).submit( function() {
    var message = sanitize( $( '#textarea-text' ).val() ), messageParts;

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
        clearTextarea();
      }
      else {

        if ( messageParts.length === 1 && commandsHlp.indexOf( messageParts[0] ) != -1 ) {   // does message include trigger word "help"?
          $( '#messages-ul' ).append( '<li class="notification-container highlight" onclick="$(this).slideUp( 100, function() {})">' + str10110 + '</li>' );
          autoScroll();
          clearTextarea();
        }
        else if ( messageParts[0] === 'nukeme' ) {
          socket.emit( 'nukeme' );
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
          socket.emit( 'transaction', [messageParts, Cookies.get( 'uPhrase' )], function( callback ) {
            if ( callback ) { clearTextarea() }
          } );
        }
      }
    }

    return false;
  } );

  function clearTextarea() {
    $( '#textarea-text' ).val( '' );
    $( '#textarea-text' ).attr( 'rows', '1' );
  }

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

  //checks if 3d transforms are supported removing the modernizr dependency
  var cssTransforms3d = ( function csstransforms3d() { // eslint-disable-line vars-on-top
    var el = document.createElement( 'p' ),
      supported = false,
      transforms = {
        'webkitTransform':'-webkit-transform',
        'OTransform':'-o-transform',
        'msTransform':'-ms-transform',
        'MozTransform':'-moz-transform',
        'transform':'transform'
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

  $( document ).ready( function() {
    $( '#menu-btn' ).change( function() {
      toggleOverlay();
      clearTextarea();
    } );
  } );

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


}( jQuery ) );
