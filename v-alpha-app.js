// Value Instrument Alpha | Version 0.4.0 | Apache 2.0 License | https://github.com/valueinstrument/vi-alpha

//*****************    System Init    ********************* //

// Date

const installDate = new Date( Date.now() );
const formattedDate = installDate.toDateString() + ' - ' + installDate.toTimeString().slice( 0, 5 );

// system

const systemInit = require( './systemInit' );

const express = require( 'express' );
const app = express();
const compression = require( 'compression' );
const minify = require( 'express-minify' );
const http = require( 'http' ).Server( app );
const io = require( 'socket.io' )( http );
const path = require( 'path' );
const mongoose = require( 'mongoose' );


// database

const EntityDB = require( './db/entities' );

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/' + systemInit.communityGovernance.commName.replace( /\s/g, '-' );

mongoose.connect( mongoUrl, function( err ) {
  if ( err ) {

    console.log( err );
  }
  else {
    if ( !( systemInit.production ) ) {
      mongoose.connection.db.dropDatabase( function( err ) {

        if ( err ) {
          console.log( err );

        }

        systemInit.initializeDatabase ? require( './functions/database-initialization' ).dbInit() : null; // eslint-disable-line global-require
        // optionally load demo/testing content
        systemInit.geoModule && systemInit.loadDemoContent ? require( './public/plugins/map/js/geoDemoContent' ).geoDemoA() : null; // eslint-disable-line global-require
        systemInit.geoModule && systemInit.loadDemoContent ? require( './public/plugins/map/js/geoDemoContent' ).geoDemoC() : null; // eslint-disable-line global-require
        systemInit.geoModule && systemInit.loadDemoContent ? require( './public/plugins/map/js/geoDemoContent' ).geoDemoB() : null; // eslint-disable-line global-require
        systemInit.poolModule && systemInit.loadDemoContent ? require( './public/plugins/pool/js/poolDemoContent' ).poolDemoA() : null; // eslint-disable-line global-require
        systemInit.poolModule && systemInit.loadDemoContent ? require( './public/plugins/pool/js/poolDemoContent' ).poolDemoB() : null; // eslint-disable-line global-require
        systemInit.contributionModule && systemInit.loadDemoContent ? require( './public/plugins/contribution/js/qcDemoContent' ).contributionDemo() : null; // eslint-disable-line global-require


        console.log( '(' + formattedDate + ') ' + 'Dropped MongoDB ' );
        console.log( '(' + formattedDate + ') ' + 'Connected to MongoDB ' );

      } );
    }
    else {

      console.log( '(' + formattedDate + ') ' + 'Kept MongoDB intact' );
      console.log( '(' + formattedDate + ') ' + 'Connected to MongoDB ' );

    }
  }
} );


// set all users to offline on start

EntityDB.find().select( 'credentials' ).exec( ( err, res ) => {
  res.forEach( res => {
    res.credentials.socketID = 'offline';
    res.save();
  } );
} );


// app & server

app.get( '/', function( req, res ) {
  res.sendFile( __dirname + '/public/index-' + systemInit.communityGovernance.indexSuffix + '.html' );
} );

app.use( compression() );
app.use( minify() );
app.use( express.static( path.join( __dirname, 'public' ) ) );


http.listen( systemInit.communityGovernance.commPort, 'localhost', function() {
  console.log( '(' + formattedDate + ') ' + 'Listening on port ' + systemInit.communityGovernance.commPort );
} );

//*****************    Plugins    ********************* //

// Map Module

if ( systemInit.geoModule ) { require( './public/plugins/map/js/v-alpha-map' )( io ) } // eslint-disable-line global-require

// Pools Module

if ( systemInit.poolModule ) { require( './public/plugins/pool/js/v-alpha-pool' )( io ) }  // eslint-disable-line global-require

// Contributions Module

if ( systemInit.contributionModule ) { require( './public/plugins/contribution/js/v-alpha-qc' )( io ) }  // eslint-disable-line global-require

// Telegram Module

if ( systemInit.telegramModule.on ) {
  const telegramBotListener = require( './functions/plugins/telegram/telegram').telegramConnect;
  telegramBotListener( io );
}

//*****************    Core functionality    ********************* //

require( './functions/message' )( io );   // chat message function

require( './functions/transaction-mongodb/transaction' )( io );   // new transaction function

require( './functions/user-management' )( io );   // user management functions

require( './functions/page-content' )( io );   // get page content functions

const tools = require( './functions/tools' );   // get tool functions


//*****************    Update Visualizations Frequently    ********************* //


setInterval( function() { tools.updateVisualizations( io ) }, systemInit.tokenDyn.updateVisFreq * 1000 );


//*****************    Payout    ********************* //


setInterval( function() { tools.payoutEmit( io ) }, systemInit.tokenDyn.payoutInterval * 1000 );
