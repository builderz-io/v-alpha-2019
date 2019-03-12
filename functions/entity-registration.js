
const systemInit = require( '../systemInit' );
const i18n = require( '../lang/' + systemInit.language );
const tools = require( './tools' );

const EntityDB = require( '../db/entities' );
const TxDB = require( '../db/transactions' );

const moment = require( 'moment' );

const capOnWords = systemInit.communityGovernance.capWordLength;
const humanWords = systemInit.communityGovernance.maxHumanWords;
const entityWords = systemInit.communityGovernance.maxEntityWords;
const maxWordLength = systemInit.communityGovernance.maxWordLength;

const commName = systemInit.communityGovernance.commName;
const commTag = systemInit.communityGovernance.commTag;

const daysToZero = systemInit.tokenDyn.daysToZero;
const baseTimeToZero = systemInit.tokenDyn.baseTimeToZero * daysToZero;


module.exports.writeEntityToDB = ( entityData ) => {

  var checkLength = entityData.entry.split( ' ' ).length;
  var wordLengthExeeded = entityData.entry.split( ' ' ).map( item => { return item.length > maxWordLength } );

  if (
    ['vx', 'Vx'].includes( entityData.entry.substring( 0, 2 ) ) ||
       ( systemInit.communityGovernance.excludeNames.includes( tools.constructUserName( entityData.entry ) ) && !( entityData.firstRegistration ) ) ||
       entityData.entry.length > 200 ||
       entityData.entry.length < 2 ||
       entityData.entry.indexOf( '#' ) != -1 ||
       entityData.entry.indexOf( '2121' ) != -1 ||
       checkLength > capOnWords ||
       ( ['member', 'network'].includes( entityData.role ) && checkLength > humanWords ) ||
       ( ['member', 'network'].indexOf( entityData.role ) == -1 && checkLength > entityWords ) ||
       wordLengthExeeded.includes( true )
  ) {
    return new Promise( resolve => {
      resolve( 'not allowed' );
    } );
  }

  function userTag( tags ) {
    var continueDice = true;

    while ( continueDice ) { // 334 combinations in the format of #5626
      const number1 = String( Math.floor( Math.random() * ( 9 - 2 + 1 ) ) + 2 );
      const number2 = String( Math.floor( Math.random() * ( 9 - 1 + 1 ) ) + 1 );
      const number3 = String( Math.floor( Math.random() * ( 9 - 2 + 1 ) ) + 2 );

      if (
        number2 != number1 &&
           number3 != number1 &&
           number3 != number2 &&
           [number1, number2, number3].indexOf( '7' ) == -1 && // has two syllables
           [number1, number2, number3].indexOf( '4' ) == -1 && // stands for death in asian countries
           number1 + number2 != '69' && // sexual reference
           number3 + number2 != '69' &&
           number1 + number2 != '13' && // bad luck in Germany
           number3 + number2 != '13' &&
           tags.indexOf( '#' + number1 + number2 + number3 + number2 ) == -1
      ) {
        continueDice = false;
        return '#' + number1 + number2 + number3 + number2;
      }
    }
  }

  const userData = () => {
    return new Promise( ( resolve ) => {
      EntityDB.find( {'credentials.name': tools.constructUserName( entityData.entry )}, {uPhrase: false} ).exec( ( err, res ) => { // {$and: [{name: sender}, {name: recipients[0]}]}
        const tags = [systemInit.initTag];
        res.forEach( item => {tags.push( item.tag )} );
        resolve( tags );
      } );
    } );
  };

  return new Promise( resolve => {

    userData().then( tags => {

      return ( () => {
        if ( tags.length == 1 ) { return tags }
        else {
          return userTag( tags );
        }
      } )();

    } ).then( theOneTag => {

      const user = tools.constructUserName( entityData.entry );
      const date = new Date();

      const newEntity = new EntityDB( {
        fullId: user + ' ' + theOneTag,
        uPhrase: entityData.uPhrase,
        credentials: {
          name: user,
          tag: theOneTag,
          role:  entityData.role,
          status:  entityData.status,
          socketID: entityData.socketID,
        },
        stats: {
          sendVolume: 0,
          receiveVolume: 0,
        },
        profile: {
          joined: date,
          lastLogin: date,
          loginExpires: entityData.loginExpires,
          timeZone: entityData.tz,
        },
        owners: [{
          ownerName: tools.constructUserName( entityData.ownerAdmin.creator ),
          ownerTag: entityData.ownerAdmin.creatorTag,
        }],
        admins: [{
          adminName: tools.constructUserName( entityData.ownerAdmin.creator ),
          adminTag: entityData.ownerAdmin.creatorTag,
        }],
        onChain: {
          balance: entityData.initialBalance,
          lastMove: Number( Math.floor( date / 1000 ) ),
          timeToZero: baseTimeToZero,
        }
      } );

      if ( entityData.properties ) {
        newEntity.properties = entityData.properties;
      }
      else {
        newEntity.properties = { description: '' };
      }

      if ( entityData.geometry ) {
        newEntity.geometry = entityData.geometry;
      }

      if ( entityData.ethCredentials.address ) {
        newEntity.ethCredentials = entityData.ethCredentials;
      }

      newEntity.save( ( err ) => {
        if ( err ) { console.log( 'Error saving new entity to EntityDB - ' + err ); return }

        new TxDB( {
          name: user,
          tag: theOneTag,
          txHistory: {
            date: date,
            initiator: commName,
            initiatorTag: commTag,
            from: commName,
            fromTag: commTag,
            to: user,
            toTag: theOneTag,
            for: i18n.strInit110,
            senderFee: 0,
            burned: 0,
            tt0: baseTimeToZero,
            credit: entityData.initialBalance,
            debit: 0,
            chainBalance: entityData.initialBalance,
          }
        } ).save( ( err ) => {
          if ( err ) { console.log( 'Error saving new entity transaction to TxDB - ' + err ); return }

          console.log( '(' + moment().format( 'D MMM YYYY h:mm a' ) + ') ' + user + ' ' + theOneTag + ' registered' );

          resolve( {
            user: user,
            tag: theOneTag,
            uPhrase: entityData.uPhrase,
            loginExpires: entityData.loginExpires,
            saved: true,
            type: entityData.role,
          } );

        } ); // save inital tx
      } ); // save new user

    } ).catch( ( err ) => {

      console.log( 'Issue with new entity signup - ' + err );

      resolve( false );

    } ); // end save new User

  } ); // end new Promise

}; // end module.exports
