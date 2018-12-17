
const systemInit = require('../systemInit');

const EntityDB = require('../db/entities');

const moment = require('moment');

const daysToZero = systemInit.tokenDyn.daysToZero;
const baseTimeToZero = systemInit.tokenDyn.baseTimeToZero * daysToZero;


module.exports.updateVisualizations = (io) => {

  try {

    EntityDB.find({'credentials.socketID': {$ne: 'offline'}}, { credentials: 1, onChain: 1, _id: 0 }).exec(function(err, res) {
      if (err) { console.log('Error updating visualizations - ' + err); return; }

      for (let i = 0; i < res.length; i++) {
        let userAcc = res[i].onChain,
          snapTimeStamp = Math.floor(Date.now() / 1000),
          remainingTimeToZero = userAcc.lastMove + userAcc.timeToZero - snapTimeStamp,
          burnedUserBalance = Math.ceil(userAcc.balance - ( userAcc.balance / (userAcc.timeToZero / ( snapTimeStamp - userAcc.lastMove )))),
          spendable = Math.floor(burnedUserBalance / (1 + systemInit.tokenDyn.setTxFee));

        io.sockets.connected[res[i].credentials.socketID].emit('user account data', {
          spendable: spendable,
          rt0: Math.ceil(remainingTimeToZero/(baseTimeToZero/daysToZero)),
          balance: userAcc.balance,
          at0: Math.floor(userAcc.timeToZero/(baseTimeToZero/daysToZero)),
          dt0: daysToZero,
        });
      }
    });

  } catch (err) {
    console.log('Error updating visualizations (caught) - ' + err);
  }
};

module.exports.convertLinks = (text) => {

  var link = text.match(/(?:www|https?)[^\s]+/g),
    aLink = [],
    repText = text;

  if (link != null) {

    for (let i=0; i<link.length; i++) {
      var replace;
      if (!( link[i].match(/(http(s?)):\/\//) ) ) { replace = 'http://' + link[i]; } else { replace = link[i]; }
      var linkText = replace.split('/')[2];
      if (linkText.substring(0,3) == 'www') { linkText = linkText.replace('www.',''); }
      aLink.push('<a href="' + replace + '" target="_blank">' + linkText + '</a>');
      repText = repText.split(link[i]).join(aLink[i]);
    }

    return repText;

  } else {
    return text;
  }
}

module.exports.forceCapOnName = (input) => { // TODO: to be removed once tags are working on transactions

  const string = input.replace(/[0-9\s]+/g, '').replace('ä','ae').replace('ö','oe').replace('ü','ue').replace('ß','ss').trim().toLowerCase();
  return string.charAt(0).toUpperCase() + string.slice(1);

};

module.exports.handleMongoDBerror = (req, err) => {
  console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'MongoDB Error - ' + req + ' - ' + err);
};
