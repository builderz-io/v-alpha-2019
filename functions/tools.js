
const systemInit = require('../systemInit');
const daysToZero = systemInit.tokenDyn.daysToZero;
const baseTimeToZero = systemInit.tokenDyn.baseTimeToZero * daysToZero;

module.exports.forceNiceLookingName = (input) => {

  var string = input.replace(/[0-9\s]+/g, '').replace('ä','ae').replace('ö','oe').replace('ü','ue').replace('ß','ss').trim().toLowerCase();
  return string.charAt(0).toUpperCase() + string.slice(1);

}


module.exports.updateVisualizations = (io) => {

  EntityDB.find({}).exec(function(err, res) {
      if (err) return handleMongoDBerror('Run updateVisualizationsF from DB', err);

      for (i = 0; i < res.length; i++) {

        var userAcc = res[i].onChain;
            snapTimeStamp = Math.floor(Date.now() / 1000),
            remainingTimeToZero = userAcc.lastMove + userAcc.timeToZero - snapTimeStamp,
            burnedUserBalance = Math.ceil(userAcc.balance - ( userAcc.balance / (userAcc.timeToZero / ( snapTimeStamp - userAcc.lastMove )))),
            spendable = Math.floor(burnedUserBalance / (1 + systemInit.tokenDyn.setTxFee));


        res[i].profile.socketID != 'offline' ?
               io.sockets.connected[res[i].profile.socketID].emit('user account data', { 'spendable': spendable, 'rt0': Math.ceil(remainingTimeToZero/(baseTimeToZero/daysToZero)), 'balance': userAcc.balance, 'at0': Math.floor(userAcc.timeToZero/(baseTimeToZero/daysToZero)), 'dt0': daysToZero } ) : false;
      }
   });
}
