
const systemInit = require( '../systemInit' );
const i18n = require( '../lang/' + systemInit.language );

const EntityDB = require( '../db/entities' );
const TxDB = require( '../db/transactions' );

const moment = require( 'moment' );


exports = module.exports = function( io ) {

  io.sockets.on( 'connection', function( socket ) {

    socket.on( 'tx history', function() {

      TxDB.findOne( {'$and' : [{'name': socket.user}, {'tag': socket.userTag}] }, { 'txHistory': { '$slice': [ -300, 300 ] } } ).exec( function( err, docs ) {
        if ( err ) { return console.log( 'Get TX History from DB - ' + err ) }
        socket.emit( 'tx history',
          [
            docs,
            systemInit.tokenDyn.baseTimeToZero,
            systemInit.tokenDyn.setTxFee,
            systemInit.tokenDynDisplay.displayBurn,
            systemInit.tokenDynDisplay.displayTt0,
            systemInit.tokenDynDisplay.tt0StringTable,
          ]
        );
      } );
    } );

    socket.on( 'download tx history', function() {

      // TODO: filter between two dates.

      TxDB.findOne( {'$and' : [{'name': socket.user}, {'tag': socket.userTag}] } ).exec( function( err, docs ) {
        if ( err ) { return console.log( 'Get TX History from DB - ' + err ) }
        socket.emit( 'download tx history',
          [
            docs,
            systemInit.tokenDyn.baseTimeToZero,
            systemInit.tokenDyn.setTxFee,
            systemInit.tokenDynDisplay.displayBurn,
            systemInit.tokenDynDisplay.displayTt0,
            systemInit.tokenDynDisplay.tt0StringTable,
          ]
        );
      } );
    } );

    socket.on( 'profile', function() {

      const profileData = async () => {

        const core = await EntityDB.findOne( {'$and' : [{'credentials.name': socket.user}, {'credentials.tag': socket.userTag}] } ).exec();

        const dataArr = [
          [i18n.strPfPg550, core.stats.receiveVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
          [i18n.strPfPg551, core.stats.sendVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
          ['<span class="strong-weight">' + i18n.strPfPg552 + '</span>', ''],
          ['&nbsp;', ''],
          ['&nbsp;', '<button class="copy-btn strong-weight" onclick="copyToClipboard('+ '"#uPhrase-profile"' +')">' + 'copy' + '</button>'],
          [i18n.strPfPg556, '<span class="" id="uPhrase-profile">' + core.credentials.uPhrase + '</span>'],
          ['&nbsp;', ''],
          [i18n.strPfPg553, moment( core.profile.loginExpires ).format( 'DD MMMM YYYY' )],
          [i18n.strPfPg554, moment( core.profile.joined ).format( 'DD MMMM YYYY' )],
          [i18n.strPfPg555, core.credentials.role.charAt( 0 ).toUpperCase() + core.credentials.role.substr( 1 )],
          [i18n.strPfPg559, core.credentials.tag],
          [i18n.strPfPg557, core.credentials.name],
          ['<span class="strong-weight">' + i18n.strPfPg558 + '</span>', ''],
        ];

        if ( systemInit.poolModule || systemInit.contributionModule || systemInit.geoModule ) {
          dataArr.unshift( ['&nbsp;', ''] );
          dataArr.unshift( ['<span class="strong-weight center-text">' + i18n.strPfPg630 + '</span>', ''] );
        }

        if( systemInit.poolModule ) {

          const pools = await EntityDB.find( { '$and': [{'credentials.role': 'pool'}, {'properties.creator': socket.user}, {'credentials.status': 'active'}] } ).exec();

          if ( pools.length ) {
            dataArr.unshift( ['&nbsp;', ''] );
            dataArr.unshift( ['<span class="strong-weight">' + i18n.strPfPg600 + '</span>', ''] );
            pools.forEach( ( pool ) => {
              const entry = '&#9673; ' + pool.credentials.name + '<br/>' + pool.properties.description + '<br/>' + i18n.strPfPg570 + ' ' + pool.credentials.uPhrase;
              dataArr.unshift( [entry, pool.onChain.balance + '/' + pool.properties.target + ' <span class="currency-unit">' + i18n.str60010 + '</span><br/><button id="' + pool._id + '" class="disable-pool">' + i18n.strPfPg580 + '</button>'] );
            } );
          }
        }

        if( systemInit.contributionModule ) {

          const qcs = await EntityDB.find( { '$and': [{'credentials.role': 'contribution'}, {'properties.creator': socket.user}, {'credentials.status': 'active'}] } ).exec();
          if ( qcs.length ) {

            dataArr.unshift( ['&nbsp;', ''] );
            dataArr.unshift( ['<span class="strong-weight">' + i18n.strPfPg620 + '</span>', ''] );

            qcs.forEach( ( qc ) => {
              const entry = '&#9673; ' + qc.credentials.name + '<br/>' + qc.properties.description + '<br/>' + i18n.strPfPg570 + ' ' + qc.credentials.uPhrase;
              dataArr.unshift( [entry, qc.onChain.balance + ' <span class="currency-unit">' + i18n.str60010 + '</span><br/><button id="' + qc._id + '" class="disable-qc">' + i18n.strPfPg580 + '</button>'] );
            } );
          }
        }

        if( systemInit.geoModule ) {

          const locs = await EntityDB.find( { '$and': [{'credentials.role': 'location'}, {'properties.creator': socket.user}, {'credentials.status': 'active'}] } ).exec();
          if ( locs.length ) {

            dataArr.unshift( ['&nbsp;', ''] );
            dataArr.unshift( ['<span class="strong-weight">' + i18n.strPfPg610 + '</span>', ''] );

            locs.forEach( ( loc ) => {
              const entry = '&#9673; ' + loc.credentials.name + ' (in ' + loc.properties.location + ')' + '<br/>' + i18n.strPfPg570 + ' ' + loc.credentials.uPhrase;
              dataArr.unshift( [entry, loc.properties.price + ' <span class="currency-unit">' + i18n.str60010 + '</span> / ' + loc.properties.unit + '<br/><button id="' + loc._id + '" class="disable-loc">' + i18n.strPfPg580 + '</button>'] );
            } );
          }
        }

        return dataArr;
      };

      profileData().then( dataArr => { return socket.emit( 'profile', dataArr ) } );

    } );

    socket.on( 'about community', function() {

      const commProfileData = async () => {

        const community =  EntityDB.findOne( { 'credentials.role': 'community' } ).exec();
        const sendVol =  EntityDB.find( { 'credentials.role': { '$in': [ 'member' ] } } ).sort( {'stats.sendVolume':-1} ).limit( 10 ).exec();
        const receiveVol = EntityDB.find( { 'credentials.role': { '$in': [ 'member' ] } } ).sort( {'stats.receiveVolume':-1} ).limit( 10 ).exec();
        const verifiedMembers = EntityDB.countDocuments( {'credentials.role': 'member'} ).exec();
        const activeLocations = EntityDB.countDocuments( {'$and' : [{'credentials.role': 'location'}, {'credentials.status': 'active'}] } ).exec();
        const activeContributions = EntityDB.countDocuments( {'$and' : [{'credentials.role': 'contribution'}, {'credentials.status': 'active'}] } ).exec();
        const activePools = EntityDB.countDocuments( {'$and' : [{'credentials.role': 'pool'}, {'credentials.status': 'active'}] } ).exec();
        const taxPool =  EntityDB.findOne( { 'credentials.role': 'taxpool' } ).exec();

        const all = await Promise.all( [community, sendVol, receiveVol, verifiedMembers, activeLocations, activePools, taxPool, activeContributions] );

        const token = systemInit.tokenDyn;
        const string = systemInit.tokenDynDisplay;
        const gov = systemInit.communityGovernance;

        var tw, fb, web, tele;

        gov.tw != '' ? tw = '<a href="https://twitter.com/' + gov.tw + '" target="_blank">' + gov.tw + '</a>' : tw = '-';
        gov.fb != '' ? fb = '<a href="https://facebook.com/' + gov.fb + '" target="_blank">' + gov.fb + '</a>' : fb = '-';
        gov.web != '' ? web = '<a href="https://' + gov.web + '" target="_blank">' + gov.web + '</a>' : web = ' ';
        gov.tele != '' ? tele = '<a href="https://t.me/' + gov.tele + '" target="_blank">' + gov.tele + '</a>' : tele = ' ';

        const dataArr = [
          [i18n.strCmPg512, all[3]],
          [i18n.strCmPg513, all[0].stats.allTimeVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
          ['<span class="strong-weight">' + i18n.strCmPg514 + '</span>', ''],
          ['&nbsp;', ''],
          [i18n.strCmPg515, ( token.setTxFee * 100 ).toFixed( 2 ) + ' %'],
          [i18n.strCmPg516, string.tt0String],
          [i18n.strCmPg518, string.intervalString],
          [i18n.strCmPg519, token.payout + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
          ['<span class="strong-weight">' + i18n.strCmPg520 + '</span>', ''],
          ['&nbsp;', ''],
          [i18n.strCmPg525, tele],
          [i18n.strCmPg521, web],
          [i18n.strCmPg522, tw],
          [i18n.strCmPg523, fb],
          ['<span class="strong-weight">' + i18n.strCmPg524 + '</span>', ''],
        ];

        if( systemInit.taxPool.displayInStats ) {
          dataArr.unshift( [i18n.strCmPg540, all[6].onChain.balance + ' <span class="currency-unit">' + i18n.str60010 + '</span>'] );
        }

        if( systemInit.geoModule ) {
          dataArr.unshift( [i18n.strCmPg511, all[4]] );
        }

        if( systemInit.poolModule ) {
          dataArr.unshift( [i18n.strCmPg530, all[5]] );
        }

        if( systemInit.contributionModule ) {
          dataArr.unshift( [i18n.strCmPg550, all[7]] );
        }

        // add most active recipients
        dataArr.unshift( ['&nbsp;', ''] );
        dataArr.unshift( ['<span class="strong-weight">' + i18n.strCmPg509 + '</span>', ''] );
        all[2].forEach( ( recipient ) => {
          dataArr.unshift( [recipient.credentials.name + ' <span class="user-tag">' + recipient.credentials.tag + '</span>', recipient.stats.receiveVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'] );
        } );

        // add most active senders
        dataArr.unshift( ['&nbsp;', ''] );
        dataArr.unshift( ['<span class="strong-weight">' + i18n.strCmPg510 + '</span>', ''] );
        all[1].forEach( ( sender ) => {
          dataArr.unshift( [sender.credentials.name + ' <span class="user-tag">' + sender.credentials.tag + '</span>', sender.stats.sendVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'] );
        } );

        return dataArr;
      };

      commProfileData().then( dataArr => { return socket.emit( 'about community', dataArr ) } );

    } ); // end "about community"

  } ); // end io.sockets.on "connection"

}; // end exports
