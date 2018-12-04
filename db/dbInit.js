var moment = require('moment');

const systemInit = require('../systemInit.js');
const i18n = require('../lang/' + systemInit.language);

const commNameFull = systemInit.communityGovernance.commName;
const commIgnition = systemInit.communityGovernance.commIgnition;
const commName = forceNiceLookingName(commNameFull);
const initiator = commName;

const daysToZero = systemInit.tokenDyn.daysToZero;
const baseTimeToZero = systemInit.tokenDyn.baseTimeToZero * daysToZero;
const initialBalance = systemInit.tokenDyn.initialBalance;
const setTxFee = systemInit.tokenDyn.setTxFee;
const ubi = systemInit.tokenDyn.ubi;
const taxPool = systemInit.taxPool;

const ChatDB = require('./messages');
const EntityDB = require('./entities');
const TxDB = require('./transactions');

function forceNiceLookingName(input) {
  var string = input.replace(/[^A-Za-z]+/g, '').trim().toLowerCase();
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {

  dbInit: function () {

     var date = new Date();
     var expiryDate = new Date(date).setMonth(new Date(date).getMonth() + 12 * 10);

     systemInit.admins.forEach((admin) => {

       var adminUser = new EntityDB({
         name: admin.name,
         uPhrase: admin.uPhrase,
         role: 'admin',
         status: 'active',
         stats: {
           sendVolume: 0,
           receiveVolume: 0,
         },
         profile: {
           joined: date,
           lastLogin: date,
           accessExpires: expiryDate,
           name: admin.name,
           role: 'admin',
           status: 'active',
           karma: 10,
           socketID: String('offline'),
         },
         onChain: {
           balance: initialBalance,
           lastMove: Number(Math.floor(date / 1000)),
           timeToZero: baseTimeToZero,
         }
       }).save((err, res) => { err ? console.log(err) : console.log('Wrote admin user to EntityDB');

         var newTx = new TxDB({
           name: admin.name,
           txHistory: {
             date: date,
             initiator: initiator,
             from: commNameFull,
             to: admin.name,
             for: i18n.strInit110,
             senderFee: 0,
             burned: 0,
             tt0: baseTimeToZero,
             credit: initialBalance,
             debit: 0,
             chainBalance: initialBalance,
           }
         }).save((err, res) => { err ? console.log(err) : console.log('Wrote admin welcome balance to TxDB'); });

       });

     }); // end admins-setup forEach

     var community = new EntityDB({
       name: commName,
       uPhrase: systemInit.communityGovernance.commuPhrase,
       role: 'community',
       status: 'active',
       stats: {
         sendVolume: 0,
         receiveVolume: 0,
         allTimeVolume: 0,
         valueInCirculation: 0,
         valueSubstance: 0,
         verifiedMembers: 0,
         locations: 0,
         pools: 0,
       },
       profile: {
         joined: date,
         lastLogin: date,
         accessExpires: expiryDate,
         name: commName,
         role: 'community',
         status: 'active',
         karma: 10,
         socketID: 'offline',
       },
       onChain: {
         balance: commIgnition,
         lastMove: Number(Math.floor(date / 1000)),
         timeToZero: baseTimeToZero,
       }
     }).save((err, res) => { err ? console.log(err) : console.log('Wrote community info to EntityDB');

         var newTx = new TxDB({
           name: commName,
           txHistory: {
             date: date,
             initiator: initiator,
             from: commNameFull,
             to: commName,
             for: i18n.strInit120,
             senderFee: 0,
             burned: 0,
             tt0: baseTimeToZero,
             credit: commIgnition,
             debit: 0,
             chainBalance: commIgnition,
           }
         }).save((err, res) => { err ? console.log(err) : console.log('Wrote admin welcome balance to TxDB');
         });
     });


     var communityTaxPool = new EntityDB({
       name: taxPool.name,
       uPhrase: taxPool.uPhrase,
       role: 'taxpool',
       status: 'active',
       stats: {
         sendVolume: 0,
         receiveVolume: 0,
         allTimeVolume: 0,
         valueInCirculation: 0,
         valueSubstance: 0,
         verifiedMembers: 0,
         locations: 0,
         pools: 0,
       },
       profile: {
         joined: date,
         lastLogin: date,
         accessExpires: expiryDate,
         name: taxPool.name,
         role: 'taxpool',
         status: 'active',
         karma: 10,
         socketID: 'offline',
       },
       onChain: {
         balance: taxPool.ignition,
         lastMove: Number(Math.floor(date / 1000)),
         timeToZero: baseTimeToZero,
       },
       poolData: {
         title: taxPool.name,
         description: taxPool.description,
         creator: commName,
         created: date,
         fillUntil: expiryDate,
         expires: expiryDate,
         status: 'active',
         target: taxPool.target,
       },
     }).save((err, res) => { err ? console.log(err) : console.log('Wrote tax pool to EntityDB');

         var newTx = new TxDB({
           name: taxPool.name,
           txHistory: {
             date: date,
             initiator: initiator,
             from: commNameFull,
             to: taxPool.name,
             for: i18n.strInit120,
             senderFee: 0,
             burned: 0,
             tt0: baseTimeToZero,
             credit: taxPool.ignition,
             debit: 0,
             chainBalance: taxPool.ignition,
           }
         }).save((err, res) => { err ? console.log(err) : console.log('Wrote tax pool balance to TxDB');
         });
     });


     var firstMsg = new ChatDB({
       msg: i18n.strInit140 + ' ' + commNameFull + '. ' + i18n.strInit143 + ' <br/><br/>',
       sender: commNameFull,
       time: date,
     }).save((err, res) => { err ? console.log(err) : console.log('Wrote first message to ChatDB'); } );

   } // end dbInit function

}
