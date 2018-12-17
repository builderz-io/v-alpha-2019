
const systemInit = require('../systemInit');
const i18n = require('../lang/' + systemInit.language);

const EntityDB = require('../db/entities');
const TxDB = require('../db/transactions');

const moment = require('moment');

const commName = systemInit.communityGovernance.commName;
const daysToZero = systemInit.tokenDyn.daysToZero;
const baseTimeToZero = systemInit.tokenDyn.baseTimeToZero * daysToZero;


module.exports.writeEntityToDB = (entityData) => {

  if (
    ['vx', 'Vx'].indexOf(entityData.entry.substring(0,2)) != -1 ||
       entityData.entry.length > 20 ||
       entityData.entry.length < 2 ||
       entityData.entry.split(' ').length > 1
  )
  {
    return 'not allowed';
  }

  function constructUserName(input) {
    return input.trim().toLowerCase().split(' ').map(function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }).join(' ');
  }

  function userTag(tags) {
    var continueDice = true;

    while (continueDice) { // 334 combinations in the format of #5626
      const number1 = String(Math.floor(Math.random() * (9 - 2 + 1)) + 2);
      const number2 = String(Math.floor(Math.random() * (9 - 1 + 1)) + 1);
      const number3 = String(Math.floor(Math.random() * (9 - 2 + 1)) + 2);

      if (
        number2 != number1 &&
           number3 != number1 &&
           number3 != number2 &&
           [number1, number2, number3].indexOf('7') == -1 &&
           number1 + number2 != '69' &&
           number3 + number2 != '69' &&
           tags.indexOf('#' + number1 + number2 + number3 + number2) == -1
      )
      {
        continueDice = false;
        return '#' + number1 + number2 + number3 + number2;
      }
    }
  }

  const userData = async () => {
    return await new Promise((resolve) => {
      EntityDB.find({'credentials.name': constructUserName(entityData.entry)}).exec( (err, res) => { // {$and: [{name: sender}, {name: recipients[0]}]}
        const tags = ['#2000'];
        res.forEach(item => {tags.push(item.tag);});
        resolve(tags);
      });
    });
  };

  return new Promise(resolve => {

    userData().then(tags => {

      return (async () => {

        if ( tags.length == 1) {
          return tags;
        } else {
          return await userTag(tags);
        }

      })();

    }).then(theOneTag => {

      const user = constructUserName(entityData.entry);
      const date = new Date();

      const newEntity = new EntityDB({
        credentials: {
          name: user,
          tag: theOneTag,
          uPhrase: entityData.uPhrase,
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
        onChain: {
          balance: entityData.initialBalance,
          lastMove: Number(Math.floor(date / 1000)),
          timeToZero: baseTimeToZero,
        }
      });

      if (entityData.properties) {
        newEntity.properties = entityData.properties;
      }

      if (entityData.geometry) { // entityData.geometry.coordinates.length > 0
        newEntity.geometry = entityData.geometry;
      }

      newEntity.save((err) => { if (err) { console.log('Error saving new entity to EntityDB - ' + err); return; }

        new TxDB({
          name: user,
          tag: theOneTag,
          txHistory: {
            date: date,
            initiator: commName,
            from: commName,
            to: user,
            for: i18n.strInit110,
            senderFee: 0,
            burned: 0,
            tt0: baseTimeToZero,
            credit: entityData.initialBalance,
            debit: 0,
            chainBalance: entityData.initialBalance,
          }
        }).save((err) => { if (err) { console.log('Error saving new entity transaction to TxDB - ' + err); return; }

          console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + user + ' ' + theOneTag + ' registered');

          resolve({
            user: user,
            tag: theOneTag,
            uPhrase: entityData.uPhrase,
            loginExpires: entityData.loginExpires,
            saved: true,
          });

        }); // save inital tx
      }); // save new user

    }).catch((err) => {

      console.log('Issue with new entity signup - ' + err);

      resolve(false);

    }); // end save new User

  }); // end new Promise

}; // end module.exports
