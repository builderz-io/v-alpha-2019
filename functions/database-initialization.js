
const systemInit = require('../systemInit.js');
const i18n = require('../lang/' + systemInit.language);

const EntityDB = require('../db/entities');
const ChatDB = require('../db/messages');

const writeEntityToDB = require('../functions/entity-registration').writeEntityToDB;

const commName = systemInit.communityGovernance.commName;
const commIgnition = systemInit.communityGovernance.commIgnition;
const initialBalance = systemInit.tokenDyn.initialBalance;
const taxPool = systemInit.taxPool;


module.exports = {

  dbInit: function () {

    const date = new Date();

    systemInit.admins.forEach((admin) => {

      const entityData = {
        entry: admin.name,
        uPhrase: admin.uPhrase,
        tz: '',
        role: 'admin',
        status: 'active',
        socketID: 'offline',
        initialBalance: initialBalance,
        loginExpires: new Date(date).setMonth(new Date(date).getMonth() + 12 * 2),
      };

      writeEntityToDB(entityData).then(res => {

        console.log('Wrote Admin user "' + res.user + '" to EntityDB and TxDB');

      });

    }); // end admins-setup forEach

    const communityData = {
      entry: commName,
      uPhrase: systemInit.communityGovernance.commuPhrase,
      tz: '',
      role: 'community',
      status: 'active',
      socketID: 'offline',
      initialBalance: commIgnition,
      loginExpires: new Date(date).setMonth(new Date(date).getMonth() + 12 * 20),
    };

    writeEntityToDB(communityData).then(res => {

      // add allTimeVolume to community entity stats on initialization

      EntityDB.findOneAndUpdate(
        {'credentials.name': commName},
        { stats: {
          sendVolume: 0,
          receiveVolume: 0,
          allTimeVolume: 0,
        }},
        (err) => { if (err) return console.log('Error adding allTimeVolume to community entity stats');}
      );

      console.log('Wrote Community entity "' + res.user + '" to EntityDB and TxDB');

    });

    const taxPoolData = {
      entry: taxPool.name,
      uPhrase: taxPool.uPhrase,
      tz: '',
      role: 'taxpool',
      status: 'active',
      socketID: 'offline',
      initialBalance: initialBalance,
      loginExpires: new Date(date).setMonth(new Date(date).getMonth() + 12 * 20),
      properties: {
        description: taxPool.description,
        creator: commName,
        creatorTag: '#2000',
        created: date,
        fillUntil: new Date(date).setMonth(new Date(date).getMonth() + 12 * 20),
        expires: new Date(date).setMonth(new Date(date).getMonth() + 12 * 20),
        target: taxPool.target,
      },
    };

    writeEntityToDB(taxPoolData).then(res => {

      console.log('Wrote Tax Pool entity ' + res.user + ' to EntityDB and TxDB');

    });

    new ChatDB({
      msg: i18n.strInit140 + ' ' + commName + '. ' + i18n.strInit143 + ' <br/><br/>',
      sender: commName,
      senderTag: '#2000',
      time: date,
    }).save((err) => { err ? console.log(err) : console.log('Wrote first message to ChatDB'); } );

  } // end dbInit function

};
