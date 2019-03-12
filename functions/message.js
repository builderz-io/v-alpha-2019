
const systemInit = require( '../systemInit' );
const tools = require( './tools' );

const ChatDB = require( '../db/messages' );
const EntityDB = require( '../db/entities' );

const convertLinks = require( './tools' ).convertLinks;

exports = module.exports = function( io ) {

  io.sockets.on( 'connection', function( socket ) {

    socket.on( 'chat message', function( message ) {

      var messageL = convertLinks( message );
      const date = Date.now(); // moment.unix(Date.now()/1000).format('D MMM YYYY h:mm a');

      new ChatDB( {
        msg: messageL,
        sender: socket.user,
        senderTag: socket.userTag,
        time: date
      } ).save( function( err, res ) {
        if ( err ) { console.log( date + ' MongoDB Error - ' + err ) }
        io.emit( 'chat message', res );

        tools.notifications({ name: socket.user,
                        tag: socket.userTag,
                        action: 'Someone wrote in',
                        network: systemInit.communityGovernance.commName,
                        msg: ':\n\n"' + message + '"',
                      });

      } );
    } );

    socket.on( 'delete chat message', function( id, callback ) {

      var checker = async () => {

        const a = new Promise( resolve => { EntityDB.find( {'credentials.role': 'community'}, {admins: true} ).exec( ( err, res ) => resolve( res ) ) } );

        const b = new Promise( resolve => { ChatDB.find( {_id: id} ).exec( ( err, res ) => resolve( res ) ) } );

        const all = await Promise.all([a,b]);

        return all
      };

      checker().then( res => {

        if( !res[1] ) {
          callback( false );
          return
        }

        const admins = res[0][0].admins.map( admin => { return admin.adminName + admin.adminTag } );

          if (
            res[1][0].sender + res[1][0].senderTag === socket.user + socket.userTag ||
            admins.includes(socket.user + socket.userTag)
          ) {
            ChatDB.deleteOne( { _id: res[1][0]._id } ).exec();
            io.emit( 'chat message', {
              remove: true,
              _id: res[1][0]._id,

            } );
            callback( true );
          }
          else {
            callback( false );
          }


      } );

    } );

    // socket.on( 'remove message from stream', function( id ) {
    // } );

  } );

};
