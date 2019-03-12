
const systemInit = require( '../systemInit' );
const i18n = require( '../lang/' + systemInit.language );

const EntityDB = require( '../db/entities' );
const TxDB = require( '../db/transactions' );

const findEntities = require( './find-entities' );

const moment = require( 'moment' );

const prepPoolData = function( entity ) {
  const poolData = [];

  var svgFunded = ''; // eslint-disable-line
  var svgSpent = ''; // eslint-disable-line
  var fundSuccess = i18n.strPfPg432; // eslint-disable-line
  var budgetPercent = '', budgetUsed = i18n.strPfPg434; // eslint-disable-line

  const funded = entity.stats.receiveVolume > 0 ? Math.floor( entity.stats.receiveVolume / entity.properties.target * 100 ) : 0;
  const spent = entity.stats.receiveVolume > 0 ? Math.ceil( ( entity.stats.sendVolume * ( 1 + systemInit.tokenDyn.setTxFee ) ) / entity.stats.receiveVolume * 100 ) : 0;

  if ( funded >= 0 ) {
    svgFunded = '<svg width="100" height="100" id="funding-chart">\
             <circle r="25" cx="50" cy="50" id="funding-pie" stroke-dasharray="' + Math.floor( 158 * ( funded / 100 ) ) + ' ' + ( 158 ) + '"/>\
           </svg>';
  }

  if ( funded > 74 ) {
    fundSuccess = '<span class="online-user strong-weight">' + i18n.strPfPg433 + '</span>';
  }

  if ( spent >= 0 ) {
    svgSpent = '<svg width="100" height="100" id="spending-chart">\
    <circle r="25" cx="50" cy="50" id="spending-pie" stroke-dasharray="' + Math.floor( 158 * ( spent / 100 ) ) + ' ' + ( 158 ) + '"/>\
    </svg>';
  }

  if ( spent > 0 ) {
    budgetUsed = '<span class="spent strong-weight">' + i18n.strPfPg435 + '</span>';
    budgetPercent = '<span class="spent strong-weight">' + spent + '%</span>';
  }

  poolData.push( ['&nbsp;', ''] );
  poolData.push( ['<span class="strong-weight">' + i18n.strPfPg430 + '</span>', ''] ); // alternatively use on right side: '<button id="send-funds-pool-btn" class="fund-now" onclick="fundNow(' + "'" + entity.credentials.name + "'" + ', ' + "'" + entity.credentials.tag + "'" + ')">' + i18n.strPfPg760 + '</button>'
  poolData.push( [svgFunded, '<span class="online-user strong-weight">' + funded + '%</span>'] );
  poolData.push( ['&nbsp;', fundSuccess] );

  if ( fundSuccess != i18n.strPfPg432 ) {
    poolData.push( [svgSpent, budgetPercent] );
    poolData.push( ['&nbsp;', budgetUsed] );
  }
  poolData.push( [i18n.strPfPg431, entity.properties.target + ' <span class="currency-unit">' + i18n.str60010 + '</span>'] );

  return poolData
}


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

    socket.on( 'editable profile', function( data, callback ) {

      const profileData = async () => {

        // get accounts
        const admin = await EntityDB.findOne( { uPhrase: data[0] }, {uPhrase: false} ).exec();
        const entity = await EntityDB.findOne( { fullId: data[1] } ).exec();

        if ( entity.admins.map( a => { a.adminName + ' ' + a.adminTag } ).includes( admin.fullId ) ) {
          return [[i18n.strPfPg810, i18n.strPfPg820]]; // "You are not allowed to edit this entry"
        }


        // profile data
        const profileData = [
          ['<span class="strong-weight">' + i18n.strPfPg558 + '</span>', ''], // eslint-disable-line
          [i18n.strPfPg557, entity.credentials.name + '<input id="member-fullid" type="hidden" value="' + entity.fullId + '" />'], // hidden input required for edit/update
          [i18n.strPfPg559, entity.credentials.tag],
          [i18n.strPfPg555, entity.credentials.role.charAt( 0 ).toUpperCase() + entity.credentials.role.substr( 1 )],
          [i18n.strPfPg554, moment( entity.profile.joined ).format( 'DD MMMM YYYY' )],
          // ['Description', '<ul class="list-group"><li class="list-group-item"><p id="edit-description" class="user-profile-editable highlight-text" dBfield="properties.description">' + i18n.strPfPg770 + '</p><a href="#' + entity.properties.description + '" class="profile-social-link no-a-style">' + entity.properties.description + '</a></li></ul>'],
        ];
        const dataArr = profileData;


        // security data
        const securityData = [
          ['&nbsp;', ''],
          // ['<span class="strong-weight">' + i18n.strPfPg660 + '</span>', ''],
          [i18n.strPfPg556, '<button class="copy-btn strong-weight" onclick="copyToClipboard(' + "'#uPhrase-profile'" + ')">' + i18n.strPfPg750 + '</button>' + ' <span class="" id="uPhrase-profile">' + entity.uPhrase + '</span>'], // eslint-disable-line quotes
          // [i18n.strPfPg553, moment( entity.profile.loginExpires ).format( 'DD MMMM YYYY' )],
        ];
        dataArr.push( ... securityData );


        // pool funding and budget data
        if ( entity.credentials.role == 'pool' ) {
          dataArr.push( ... prepPoolData( entity ) );
        }


        // price data
        if ( ['skill', 'job', 'place'].includes( entity.credentials.role ) ) {
          const price = entity.properties.price ? entity.properties.price : '';
          const unitDisplay = !price || isNaN( price ) ? '' : ' <span class="currency-unit">' + i18n.str60010 + '</span>';

          const priceData = [
            ['&nbsp;', ''],
            ['<span class="strong-weight center-text">' + i18n.strPfPg420 + '</span>', ''],
            [i18n.strPfPg423, '<ul class="list-group"><li class="list-group-item"><p id="edit-price" class="user-profile-editable highlight-text" dBfield="properties.price">' + i18n.strPfPg770 + '</p><a href="#" class="profile-social-link no-a-style">' + price + '</a>' + unitDisplay + '</li></ul>'],
            [i18n.strPfPg424, '<ul class="list-group"><li class="list-group-item"><p id="edit-unit" class="user-profile-editable highlight-text" dBfield="properties.unit">' + i18n.strPfPg770 + '</p><a href="#" class="profile-social-link no-a-style">' + entity.properties.unit + '</a></li></ul>'],
          ];
          dataArr.push( ... priceData );
        }


        // location data
        const loc = entity.properties.location ? entity.properties.location : '';
        const locationData = [
          ['&nbsp;', ''],
          ['<span class="strong-weight">' + i18n.strPfPg410 + '</span>', ''],
          [i18n.strPfPg413, '<ul class="list-group"><li class="list-group-item"><p id="edit-loc" class="user-profile-editable highlight-text" dBfield="properties.location">' + i18n.strPfPg770 + '</p><a href="https://www.google.de/search?q=' + loc + '" class="profile-social-link" target="_blank">' + loc + '</a></li></ul>'],
          ['<input id="member-location-lat" type="hidden" step="0.00001" class="latlng-field"/>', '<input id="member-location-lng" type="hidden" step="0.00001" class="latlng-field"/>'],
        ];
        dataArr.push( ... locationData );


        // social data
        const fbName = entity.social.fb ? entity.social.fb : '';
        const twName = entity.social.tw ? entity.social.tw : '';
        const teleName = entity.social.tele ? entity.social.tele : '';
        const email = entity.social.email ? entity.social.email : '';
        const web = entity.social.web ? entity.social.web : '';
        const socialData = [
          ['&nbsp;', ''],
          ['<span class="strong-weight">' + i18n.strPfPg520 + '</span>', ''],
          [i18n.strPfPg521, '<ul class="list-group"><li class="list-group-item"><p id="edit-fb" class="user-profile-editable highlight-text" dBfield="social.fb">' + i18n.strPfPg770 + '</p><a href="https://facebook.com/' + fbName + '" class="profile-social-link" target="_blank">' + fbName + '</a></li></ul>'],
          [i18n.strPfPg522,  '<ul class="list-group"><li class="list-group-item"><p id="edit-tw" class="user-profile-editable highlight-text" dBfield="social.tw">' + i18n.strPfPg770 + '</p><a href="https://twitter.com/' + twName + '" class="profile-social-link" target="_blank">' + twName + '</a></li></ul>'],
          [i18n.strPfPg523, '<ul class="list-group"><li class="list-group-item"><p id="edit-tele" class="user-profile-editable highlight-text" dBfield="social.tele">' + i18n.strPfPg770 + '</p><a href="https://t.me/' + teleName + '" class="profile-social-link" target="_blank">' + teleName + '</a></li></ul>'],
          [i18n.strPfPg524,  '<ul class="list-group"><li class="list-group-item"><p id="edit-web" class="user-profile-editable highlight-text" dBfield="social.web">' + i18n.strPfPg770 + '</p><a href="https://' + web + '" class="profile-social-link" target="_blank">' + web + '</a></li></ul>'],
          [i18n.strPfPg525,    '<ul class="list-group"><li class="list-group-item"><p id="edit-email" class="user-profile-editable highlight-text" dBfield="social.email">' + i18n.strPfPg770 + '</p><a href="mailto:" class="profile-social-link">' + email + '</a></li></ul>'],
        ];
        dataArr.push( ... socialData );


        // stats data
        const statsData = [
          ['&nbsp;', ''],
          ['<span class="strong-weight">' + i18n.strPfPg552 + '</span>', ''],
          [i18n.strPfPg551, entity.stats.sendVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
          [i18n.strPfPg550, entity.stats.receiveVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
        ];
        dataArr.push( ... statsData );


        // accounts that the admin manages
        const accountData = [];

        const getAll = await Promise.all( [ EntityDB.find( find( ['pool'] ), {uPhrase: false} ), EntityDB.find( find( ['contribution'] ), {uPhrase: false} ), EntityDB.find( find( ['skill', 'job', 'place'] ), {uPhrase: false} ) ] )

        function switches( obj ) {
          var pauseBtnTxt;
          obj.credentials.status == 'active' ? pauseBtnTxt = i18n.strPfPg720 : pauseBtnTxt = i18n.strPfPg730;
          //return '<button id="' + obj._id + '" class="disable-entity switch">' + i18n.strPfPg710 + '</button>' +
            return '<button id="' + obj._id + '" class="pause-entity switch">' + pauseBtnTxt + '</button>' +
                   '<button class="edit-entity switch-highlight" fullid="' + obj.fullId + '" onclick="openEditableProfile($(this))" >' + i18n.strPfPg740 + '</button>';
        }

        function find( roles ) {
          return { '$and': [{'credentials.role': {$in: roles}}, {'properties.creator': admin.credentials.name}, {'properties.creatorTag': admin.credentials.tag}, {'credentials.status': { $in: [ 'active', 'paused' ] } }] }
        }

        function managedAccounts( entityArray ) {
          if ( entityArray.length ) {
            entityArray.forEach( ( item ) => {
              accountData.push( [ item.credentials.name, switches( item ) ] );
            } );
          }
        }

        if ( getAll[0].length || getAll[1].length || getAll[2].length ) {
          accountData.push( ['&nbsp;', ''] );
          accountData.push( ['<span class="strong-weight center-text">' + i18n.strPfPg630 + '</span>', ''] );
          accountData.push( [admin.credentials.name + ' <span style="font-size:0.7em">(' + 'this account' + ')</span>', '<button class="edit-entity switch-highlight" fullid="' + admin.fullId + '" onclick="openEditableProfile($(this))" >' + i18n.strPfPg740 + '</button>'] );
        }

        managedAccounts( getAll[0] );
        managedAccounts( getAll[1] );
        managedAccounts( getAll[2] );

        dataArr.push( ... accountData );

        var description = '<ul class="list-group"><li class="list-group-item"><p id="edit-description" class="user-profile-editable highlight-text" dBfield="properties.description">' + i18n.strPfPg770 + '</p><a href="#" class="profile-social-link no-a-style" target="_blank">' + entity.properties.description + '</a></li></ul>';
        var sendFunds = '<button id="send-funds-profile-btn" class="fund-now" onclick="fundNow(' + "'" + entity.credentials.name + "'" + ', ' + "'" + entity.credentials.tag + "'" + ')">' + i18n.strPfPg760 + '</button>';

        // finally return the whole thing
        return [dataArr.reverse(), description, sendFunds];
      };

      // send dataArr to frontend to generate and display in a table
      profileData().then( dataArr => { callback( dataArr ) } );

    } );

    socket.on( 'find entity', function( messageParts, callback ) {

      var txHistory = false;

      const uPhrase = systemInit.communityGovernance.commuPhrase; // this is only needed for findAllEntities to run

      const profileData = async () => {

        const entities = await findEntities.findAllEntities( messageParts, uPhrase );

        if ( !entities[3] ) { return false }

        const entity = await EntityDB.findOne( { '$and': [{ 'credentials.name': entities[3].credentials.name }, { 'credentials.tag': entities[3].credentials.tag }, {'credentials.status': { $in: [ 'active' ] } }] }, {uPhrase: false} ).exec();
        const isLocation = ['skill', 'job', 'place'].includes( entity.credentials.role );

        const dataArr = [];

        // prepare social data
        const fbName = entity.social.fb ? '<a id="profile-fb-link" href="https://facebook.com/' + entity.social.fb + '" target="_blank" >' + entity.social.fb + '</a>' : '-';
        const twName = entity.social.tw ? '<a id="profile-tw-link" href="https://twitter.com/' + entity.social.tw + '" target="_blank" >' + entity.social.tw + '</a>' : '-';
        const teleName = entity.social.tele ? '<a id="profile-tele-link" href="https://t.me/' + entity.social.tele + '" target="_blank" >' + entity.social.tele + '</a>' : '-';
        const email = entity.social.email ? '<a id="profile-email-link" href="mailto:' + entity.social.email + '" target="_blank" >' + entity.social.email + '</a>' : '-';
        const web = entity.social.web ? '<a id="profile-web-link" href="https://www.' + entity.social.web + '" target="_blank" >' + entity.social.web + '</a>' : '-';

        const socialData = [
          ['<span class="strong-weight">' + i18n.strPfPg520 + '</span>', ''],
          [i18n.strPfPg521, fbName],
          ['&nbsp;', ''],
        ];

        twName != '-' ? socialData.push([i18n.strPfPg522, twName]) : null;
        teleName != '-' ? socialData.push([i18n.strPfPg522, teleName]) : null;
        web != '-' ? socialData.push([i18n.strPfPg522, web]) : null;
        email != '-' ? socialData.push([i18n.strPfPg522, email]) : null;


        // prepare location data (even if undefined)
        const loc = '<a id="profile-loc" href="https://www.google.de/search?q=' + entity.properties.location + '" target="_blank" >' + entity.properties.location + '</a>';
        const locationData = [
          ['<span class="strong-weight">' + i18n.strPfPg410 + '</span>', ''],
          [i18n.strPfPg413, loc],
          ['&nbsp;', ''],
        ];


        // pool funding and budget data
        if ( entity.credentials.role == 'pool' ) {

          txHistory = await TxDB.findOne( { '$and': [{ 'name': entities[3].credentials.name }, { 'tag': entities[3].credentials.tag }] }, { 'txHistory': { $slice: [ -300, 300 ] } } ).exec(); // eslint-disable-line quote-props

          dataArr.push( ... prepPoolData( entity ) );
          dataArr.push( ['&nbsp;', ''] );
          dataArr.push( ... socialData );
          dataArr.push( ['&nbsp;', ''] );
        }


        // price data
        if ( isLocation && entity.properties.price ) {
          const price = entity.properties.price ? entity.properties.price : '';
          const unitDisplay = !price || isNaN( price ) ? '' : ' <span class="currency-unit">' + i18n.str60010 + '</span>';

          const priceData = [
            ['<span class="strong-weight center-text">' + i18n.strPfPg420 + '</span>', ''],
            [i18n.strPfPg423, price + ' ' + unitDisplay],
            [i18n.strPfPg424, i18n.strPfPg425 + ' ' + entity.properties.unit],
            ['&nbsp;', ''],
          ];
          dataArr.push( ... priceData );
        }

        // place location data here if skill, job or place
        if ( entity.properties.location && isLocation ) {
          dataArr.push( ... locationData );
        }


        // profile data
        const profileData = [
          ['<span class="strong-weight">' + i18n.strPfPg558 + '</span>', ''],
          [i18n.strPfPg557, entity.credentials.name],
          [i18n.strPfPg559, entity.credentials.tag],
          [i18n.strPfPg555, entity.credentials.role.charAt( 0 ).toUpperCase() + entity.credentials.role.substr( 1 )],
          [i18n.strPfPg554, moment( entity.profile.joined ).format( 'DD MMMM YYYY' )],
          ['&nbsp;', ''],
        ];
        dataArr.push( ... profileData );


        // creator data
        if ( entities[3].fullId == entity.fullId ) {
          const creator = entity.properties.creator ? entity.properties.creator + ' ' + entity.properties.creatorTag: entity.credentials.name + ' ' + entity.credentials.tag;
          const linkedCreator = '<span class="linked-entity" fullid="' + creator + '" >' + creator + '</span>';

          const creatorData = [
            [i18n.strPfPg640, linkedCreator],
          ];
          profileData.splice( 1, 0, creatorData[0] );
        }


        // place location data here if NOT skill, job or place
        if ( entity.properties.location && !isLocation ) {
          dataArr.push( ... locationData );
        }

        // place social data here if NOT pool
        if ( entity.credentials.role != 'pool' ) {
          dataArr.push( ... socialData );
        }


        // stats data
        const statsData = [
          ['<span class="strong-weight">' + i18n.strPfPg552 + '</span>', ''],
          [i18n.strPfPg551, entity.stats.sendVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
          [i18n.strPfPg550, entity.stats.receiveVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
          ['&nbsp;', ''],
        ];
        dataArr.push( ... statsData );

        // accounts that this entity manages
        const accountData = [];

        const getAll = await Promise.all( [ EntityDB.find( find( ['pool'] ), {uPhrase: false} ), EntityDB.find( find( ['contribution'] ), {uPhrase: false} ), EntityDB.find( find( ['skill', 'job', 'place'] ), {uPhrase: false} ) ] );

        function find( role ) {
          return { '$and': [{'credentials.role': role}, {'properties.creator': entity.credentials.name}, {'properties.creatorTag': entity.credentials.tag}, {'credentials.status': { $in: [ 'active', 'paused' ] } }] }
        }

        function managedAccounts( entityArray ) {
          if ( entityArray.length ) {
            entityArray.forEach( ( item ) => {
              accountData.push( [ item.credentials.name, '<button class="find-now" onclick="findNow(' + "'" + item.credentials.name + "'" + ', ' + "'" + item.credentials.tag + "'" + ')">' + i18n.strPfPg780 + '</button>' ] );
            } );
          }
        }

        if ( getAll[0].length || getAll[1].length || getAll[2].length ) {
          accountData.push( ['&nbsp;', ''] );
          accountData.push( ['<span class="strong-weight center-text">' + i18n.strPfPg630 + '</span>', ''] );
        }

        managedAccounts( getAll[0] );
        managedAccounts( getAll[1] );
        managedAccounts( getAll[2] );

        dataArr.push( ... accountData );

        var description = entity.properties.description;
        var sendFunds = '<button id="send-funds-profile-btn" class="fund-now" onclick="fundNow(' + "'" + entity.credentials.name + "'" + ', ' + "'" + entity.credentials.tag + "'" + ')">' + i18n.strPfPg760 + '</button>';

        // finally return the whole thing
        return [dataArr.reverse(), txHistory, description, sendFunds, entity.credentials.name];
      };

      profileData().then( entityData => { callback( entityData ) } );

    } );

    socket.on( 'about community', function( data, callback ) {

      const commProfileData = async () => {


        const community =  EntityDB.findOne( { 'credentials.role': 'community' }, {uPhrase: false} ).exec();
        const taxPool =  EntityDB.findOne( { 'credentials.role': 'taxpool' }, {uPhrase: false} ).exec();
        const sendVol =  EntityDB.find( { 'credentials.role': { '$in': [ 'member' ] } }, {credentials: true, stats: true} ).sort( {'stats.sendVolume':-1} ).limit( 10 ).exec();
        const receiveVol = EntityDB.find( { 'credentials.role': { '$in': [ 'member' ] } }, {credentials: true, stats: true} ).sort( {'stats.receiveVolume':-1} ).limit( 10 ).exec();
        const verifiedMembers = EntityDB.countDocuments( {'credentials.role': 'member'} ).exec();
        const activeLocations = EntityDB.countDocuments( {'$and' : [{'credentials.role': 'location'}, {'credentials.status': 'active'}] }).exec();
        const activeContributions = EntityDB.countDocuments( {'$and' : [{'credentials.role': 'contribution'}, {'credentials.status': 'active'}] } ).exec();
        const activePools = EntityDB.countDocuments( {'$and' : [{'credentials.role': 'pool'}, {'credentials.status': 'active'}] } ).exec();


        const all = await Promise.all( [community, sendVol, receiveVol, verifiedMembers, activeLocations, activePools, taxPool, activeContributions] );

        const token = systemInit.tokenDyn;
        const string = systemInit.tokenDynDisplay;

        const fbName = all[0].social.fb ? '<a id="profile-fb-link" href="https://facebook.com/' + all[0].social.fb + '" target="_blank" >' + all[0].social.fb + '</a>' : '-';
        const twName = all[0].social.tw ? '<a id="profile-tw-link" href="https://twitter.com/' + all[0].social.tw + '" target="_blank" >' + all[0].social.tw + '</a>' : '-';
        const teleName = all[0].social.tele ? '<a id="profile-tele-link" href="https://t.me/' + all[0].social.tele + '" target="_blank" >' + all[0].social.tele + '</a>' : '-';
        const email = all[0].social.email ? '<a id="profile-email-link" href="mailto:' + all[0].social.email + '" target="_blank" >' + all[0].social.email + '</a>' : '-';
        const web = all[0].social.web ? '<a id="profile-web-link" href="https://www.' + all[0].social.web + '" target="_blank" >' + all[0].social.web + '</a>' : '-';
        const loc = all[0].properties.location ? '<a id="profile-loc" href="https://www.google.de/search?q=' + all[0].properties.location + '" target="_blank" >' + all[0].properties.location + '</a>' : '-';
        // const lang = all[0].social.languages ? all[0].social.languages : '-';

        const dataArr = [
          [i18n.strCmPg512, all[3]], // number of verified members
          ['<span class="strong-weight">' + i18n.strCmPg514 + '</span>', ''],
          ['&nbsp;', ''],
          [i18n.strCmPg515, ( token.setTxFee * 100 ).toFixed( 2 ) + ' %'],
          [i18n.strCmPg516, string.tt0String],
          [i18n.strCmPg518, string.intervalString],
          [i18n.strCmPg519, token.payout + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
          ['<span class="strong-weight">' + i18n.strCmPg520 + '</span>', ''],
          ['&nbsp;', ''],
          [i18n.strPfPg413, loc],
          ['<span class="strong-weight">' + i18n.strPfPg410 + '</span>', ''],
          ['&nbsp;', ''],
          [i18n.strPfPg525, email],
          [i18n.strPfPg524, web],
          [i18n.strPfPg523, teleName],
          [i18n.strPfPg522, twName],
          [i18n.strPfPg521, fbName],
          ['<span class="strong-weight">' + i18n.strPfPg520 + '</span>', ''],
        ];

        if( systemInit.taxPool.displayInStats ) {
          dataArr.unshift( [i18n.strCmPg540, all[6].onChain.balance + ' <span class="currency-unit">' + i18n.str60010 + '</span>'] );
        }

        if( systemInit.poolModule ) {
          dataArr.unshift( [i18n.strCmPg530, all[5]] );
        }

        if( systemInit.geoModule ) {
          dataArr.unshift( [i18n.strCmPg511, all[4]] );
        }

        if( systemInit.contributionModule ) {
          dataArr.unshift( [i18n.strCmPg550, all[7]] );
        }

        dataArr.unshift( [i18n.strCmPg513, all[0].stats.allTimeVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'] );

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

        // add shameless advertising
        dataArr.unshift( ['&nbsp;', ''] );
        dataArr.unshift( ['', '<div id="shameless-advertising"><a class="no-a-style" href="http://valueinstrument.org" target="_blank"><span class="powered-by">' + i18n.strCmPg560 + '</span> <span class="heebo-vi-logo">VALUE INSTRUMENT</span></a></div>'] );

        return dataArr;
      };

      commProfileData().then( dataArr => { callback( dataArr ) } );

    } );

  } ); // end io.sockets.on "connection"

}; // end exports
