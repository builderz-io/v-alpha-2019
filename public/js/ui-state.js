/* eslint no-unused-vars: 0 */

function autoScroll() {
  $( '#container' ).animate( {scrollTop: $( '#container' ).get( 0 ).scrollHeight}, 500 );
}

function clearTextarea() {
  $( '#textarea-text' ).val( '' );
  $( '#textarea-text' ).attr( 'rows', '1' );
}

function closePage() {
  $( '#page' ).fadeOut( 70 );
  $( '.page-pipe' ).html( '' );
  $( '#page-description' ).html( '' ).hide();
  $( '#page-send-funds' ).html( '' ).hide();
  $( '#header-left' ).html( headerLeft );
  $( '#name-in-header' ).show();
  $( '#textarea-form' ).show();
  $( '#mn-btn-lb' ).show();

  if ( $( 'script[src^="https://maps.googleapis.com/"]' ).length != 0 ) {
    $( 'script[src^="https://maps.googleapis.com/"]' ).remove();
    $( '.pac-container' ).remove();
  }
}

function closeMapPage() {
  $( '#close-map-page' ).hide();
  $( '#map-page' ).css( 'z-index', 180 );
  $( '#header-left' ).html( headerLeft );
  $( '#textarea-form' ).fadeIn( 70 );
  $( '#name-in-header' ).show();
  $( '#mn-btn-lb' ).show();
}

function closeProfilePage() {
  $( '#header-left' ).html( headerLeft );
  $( '#profile-page' ).fadeOut( 70 );
  $( '.profile-page-pipe' ).html( '' );
  $( '#profile-page-description' ).html( '' ).hide();
  $( '#profile-page-send-funds' ).html( '' ).hide();
  if ( !( $( '#close-page' ).is( ':visible' ) || !( $( '#map-page' ).css( 'z-index' ) == 180 ) ) ) {
    $( '#name-in-header' ).show();
    $( '#textarea-form' ).show();
    $( '#mn-btn-lb' ).show();
  }
}

function loggedIn() {
  $( '.hidden-btn' ).remove();
  $( '#new-user-form' ).hide();
  $( '#system-message' ).hide();
  $( '#signup-screen' ).hide();
  $( '#signup-header' ).hide();
  $( '#container' ).show();
  $( '#textarea-form' ).show();
  $( '#mn-btn-lb' ).show();
  autoScroll();
}

function openCommunity() {
  openPage();
  socket.emit( 'about community', '', function( callback ) {
    $( '#header-left' ).html( strCmPg110 );
    $( '.page-pipe' ).html( profileTable( callback ) );
  }  );
}

function openPage() {
  resetMenu();
  $( '.page-title' ).hide().html( '' );
  $( '#page-description' ).hide().html( '' );
  $( '#page-send-funds' ).hide().html( '' );
  $( '#name-in-header' ).hide();
  $( '#page' ).show();
  $( '#close-page' ).show();
}

function openProfilePage() {
  resetMenu();
  $( '#name-in-header' ).hide();
  $( '.profile-page-title' ).html( '' );
  $( '#profile-page' ).show();
}

function resetMenu() {
  $( '#textarea-form' ).fadeOut( 70 );
  $( '#mn-btn-lb' ).fadeOut( 70 );
  clearTextarea();
  $( '#menu-btn' ).prop( 'checked', false );
  $( '#site-overlay' ).hide();
  $( '#site-overlay-2' ).hide();
}
