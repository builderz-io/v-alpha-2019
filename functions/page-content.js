exports = module.exports = function(io) {

  const EntityDB = require('../db/entities');
  const TxDB = require('../db/transactions');

  const systemInit = require('../systemInit');
  const i18n = require('../lang/' + systemInit.language);

  const moment = require('moment');


  io.sockets.on('connection', function (socket) {

      socket.on('tx history', function() {

        TxDB.findOne({name: socket.user}, { txHistory: { $slice: [ -300, 300 ] } }).exec(function(err, docs) {
                      if (err) return handleMongoDBerror('Get TX History from DB', err);
                      socket.emit('tx history', [ docs,
                                                  systemInit.tokenDyn.baseTimeToZero,
                                                  systemInit.tokenDyn.setTxFee,
                                                  systemInit.tokenDynDisplay.displayBurn,
                                                  systemInit.tokenDynDisplay.displayTt0,
                                                  systemInit.tokenDynDisplay.tt0StringTable,
                                                ]
                      );
        });
      });

      socket.on('download tx history', function() {

        // TODO: filter between two dates.

        TxDB.findOne({name: socket.user}, { txHistory: { $slice: [ -300, 300 ] } }).exec(function(err, docs) {
                      if (err) return handleMongoDBerror('Get TX History from DB', err);
                      socket.emit('download tx history', [ docs,
                                                  systemInit.tokenDyn.baseTimeToZero,
                                                  systemInit.tokenDyn.setTxFee,
                                                  systemInit.tokenDynDisplay.displayBurn,
                                                  systemInit.tokenDynDisplay.displayTt0,
                                                  systemInit.tokenDynDisplay.tt0StringTable,
                                                ]
                      );
        });
      });

      socket.on('profile', function() {

        const profileData = async() => {

          const core = await EntityDB.findOne({name: socket.user}).exec();

          var dataArr = [
                          [i18n.strPfPg550, core.stats.receiveVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
                          [i18n.strPfPg551, core.stats.sendVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
                          ['<span class="strong-weight">' + i18n.strPfPg552 + '</span>', ''],
                          ['&nbsp;', ''],
                          [i18n.strPfPg553, moment(core.profile.accessExpires).format('DD MMMM YYYY')],
                          [i18n.strPfPg554, moment(core.profile.joined).format('DD MMMM YYYY')],
                          [i18n.strPfPg555, core.profile.role.charAt(0).toUpperCase() + core.profile.role.substr(1)],
                          [i18n.strPfPg556, core.uPhrase],
                          [i18n.strPfPg557, core.name],
                          ['<span class="strong-weight">' + i18n.strPfPg558 + '</span>', ''],
                        ];

          if(systemInit.poolModule) { // { $and: [{'poolData.creator': socket.user}, {status: 'active'}] }, { poolData: 1, onChain: 1 }

            const pools = await EntityDB.find({ $and: [{'poolData.creator': socket.user}, {status: 'active'}] }, { poolData: 1, onChain: 1, uPhrase: 1 }).exec();

            if (pools.length) {
                        dataArr.unshift(['&nbsp;', '']);
                        dataArr.unshift(['<span class="strong-weight">' + i18n.strPfPg600 + '</span>', '']);
              pools.forEach((pool) => {
                var entry = '&#9673; ' + pool.poolData.title + '<br/>' + pool.poolData.description + '<br/>' + i18n.strPfPg570 + ' ' + pool.uPhrase;
                 dataArr.unshift([entry, pool.onChain.balance + '/' + pool.poolData.target + ' <span class="currency-unit">' + i18n.str60010 + '</span><br/><button id="' + pool._id + '" class="disable-pool">' + i18n.strPfPg580 + '</button>']);
              });

            }
          }

          if(systemInit.contributionModule) {

            const locs = await EntityDB.find({ $and: [{'contributionData.creator': socket.user}, {status: 'active'}] }).exec();
            if (locs.length) {

                dataArr.unshift(['&nbsp;', '']);
                dataArr.unshift(['<span class="strong-weight">' + i18n.strPfPg620 + '</span>', '']);

              locs.forEach((qc) => {
                var entry = '&#9673; ' + qc.contributionData.title + '<br/>' + qc.contributionData.description + '<br/>' + i18n.strPfPg570 + ' ' + qc.uPhrase;
                dataArr.unshift([entry, qc.onChain.balance + ' <span class="currency-unit">' + i18n.str60010 + '</span><br/><button id="' + qc._id + '" class="disable-qc">' + i18n.strPfPg580 + '</button>']);
              });

            }
          }

          if(systemInit.geoModule) {

            const locs = await EntityDB.find({'properties.creator': socket.user}).exec();
            if (locs.length) {

                dataArr.unshift(['&nbsp;', '']);
                dataArr.unshift(['<span class="strong-weight">' + i18n.strPfPg610 + '</span>', '']);

              locs.forEach((loc) => {
                var entry = '&#9673; ' + loc.properties.title + ' (in ' + loc.properties.location + ')' + '<br/>' + i18n.strPfPg570 + ' ' + loc.uPhrase;
                dataArr.unshift([entry, loc.properties.fromPrice + ' <span class="currency-unit">' + i18n.str60010 + '</span> / ' + loc.properties.unit + '<br/><button id="' + loc._id + '" class="delete-loc">' + i18n.strPfPg580 + '</button>']);
              });

            }
          }

          return dataArr
        }

        profileData().then(dataArr => socket.emit('profile', dataArr ) );

      });

      socket.on('about community', function() {

        const commProfileData = async() => {

          const community =  EntityDB.findOne({ role: 'community' }).exec();
          const sendVol =  EntityDB.find({ role: { $in: ['admin', 'member' ] } } ).sort({'stats.sendVolume':-1}).limit(10).exec();
          const receiveVol = EntityDB.find({ role: { $in: ['admin', 'member' ] } } ).sort({'stats.receiveVolume':-1}).limit(10).exec();
          const verifiedMembers = EntityDB.countDocuments({role: 'member'}).exec();
          const activeLocations = EntityDB.countDocuments({role: 'location'}).exec();
          const activeContributions = EntityDB.countDocuments({role: 'contribution'}).exec();
          const activePools = EntityDB.countDocuments({$and : [{role: 'pool'}, {status: 'active'}] }).exec();
          const taxPool =  EntityDB.findOne({ role: 'taxpool' }).exec();

          var all = await Promise.all( [community, sendVol, receiveVol, verifiedMembers, activeLocations, activePools, taxPool, activeContributions] );

          var token = systemInit.tokenDyn,
             string = systemInit.tokenDynDisplay,
                gov = systemInit.communityGovernance,
                tw, fb, web;

          gov.tw != '' ? tw = '<a href="https://twitter.com/' + gov.tw + '" target="_blank">' + gov.tw + '</a>' : tw = '-';
          gov.fb != '' ? fb = '<a href="https://facebook.com/' + gov.fb + '" target="_blank">' + gov.fb + '</a>' : fb = '-';
          gov.web != '' ? web = '<a href="https://' + gov.web + '" target="_blank">' + gov.web + '</a>' : web = ' ';

          var dataArr = [
                          [i18n.strCmPg512, all[3]],
                          [i18n.strCmPg513, all[0].stats.allTimeVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
                          ['<span class="strong-weight">' + i18n.strCmPg514 + '</span>', ''],
                          ['&nbsp;', ''],
                          [i18n.strCmPg515, (token.setTxFee * 100).toFixed(2) + ' %'],
                          [i18n.strCmPg516, string.tt0String],
                          [i18n.strCmPg518, string.intervalString],
                          [i18n.strCmPg519, token.payout + ' <span class="currency-unit">' + i18n.str60010 + '</span>'],
                          ['<span class="strong-weight">' + i18n.strCmPg520 + '</span>', ''],
                          ['&nbsp;', ''],
                          [i18n.strCmPg521, web],
                          [i18n.strCmPg522, tw],
                          [i18n.strCmPg523, fb],
                          ['<span class="strong-weight">' + i18n.strCmPg524 + '</span>', ''],
                        ];

        if(systemInit.taxPool.displayInStats) {
          dataArr.unshift([i18n.strCmPg540, all[6].onChain.balance + ' <span class="currency-unit">' + i18n.str60010 + '</span>']);
        }

        if(systemInit.geoModule) {
          dataArr.unshift([i18n.strCmPg511, all[4]]);
        }

        if(systemInit.poolModule) {
          dataArr.unshift([i18n.strCmPg530, all[5]]);
        }

        if(systemInit.contributionModule) {
          dataArr.unshift([i18n.strCmPg550, all[7]]);
        }

        // add most active recipients
        dataArr.unshift(['&nbsp;', '']);
        dataArr.unshift(['<span class="strong-weight">' + i18n.strCmPg509 + '</span>', '']);
        all[2].forEach((recipient) => {
          dataArr.unshift([recipient.name, recipient.stats.receiveVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>']);
        });

        // add most active senders
        dataArr.unshift(['&nbsp;', '']);
        dataArr.unshift(['<span class="strong-weight">' + i18n.strCmPg510 + '</span>', '']);
        all[1].forEach((sender) => {
          dataArr.unshift([sender.name, sender.stats.sendVolume + ' <span class="currency-unit">' + i18n.str60010 + '</span>']);
        });

        return dataArr
        }

        commProfileData().then(dataArr => socket.emit('about community', dataArr ) );

      });

  });

  function handleMongoDBerror(req, err) {
     console.log('(' + moment().format('D MMM YYYY h:mm a') + ') ' + 'MongoDB Error - ' + req + ' - ' + err);
  }

}
