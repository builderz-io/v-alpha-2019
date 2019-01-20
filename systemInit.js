
exports.production = false;  // resets or keeps database when restarting app // Type Boolean // 'false' to reset

exports.poolModule = false;  // enables/disables Pool Plugin // Type Boolean // 'true' to enable

exports.geoModule = false;   // enables/disables Location Plugin // Type Boolean // 'true' to enable

exports.contributionModule = false;   // enables/disables Contribution Plugin // Type Boolean // 'true' to enable

exports.language = 'en-US';  // sets the app-language // Type String // e.g. en US for English, de DE for German

exports.initTag = '#2121'; // the first entity tag // MUST be 4 digits preceded by '#' , e.g. '#2121' // Type String

exports.admins = [  // add objects for each admin

                 {
                   name: 'Thomas Blake',  // the community admin name // MUST be in one word // MUST have capital initials // Type String // choose your preferred admin name
                   uPhrase: 'vxiZ8ctNNKmsz1gdvnAABt', // corresponding admin uPhrase // MUST start with "vx" // Type String // choose your preferred phrase
                   tag: exports.initTag,
                 },

                 {
                   name: 'Walther Blake',
                   uPhrase: 'vxiZ8ctagtmsz1gdvnAABt',
                   tag: exports.initTag,
                 },

               ];

exports.communityGovernance = {
                                  commName: 'Value',  // the community name // MUST be in one word // MUST have capital initials // Type String
                                  commuPhrase: 'vxVITestLogin',  // corresponding community uPhrase // MUST start with "vx" // Type String
                                  commTag: exports.initTag,
                                  commIgnition: 9000,  // token amount for community account at start // Type Number (integer)
                                  fb: 'valueinstrument',  // Social Media Links // Type String
                                  tw: 'valueinstrument',
                                  web: 'valueinstrument.org',
                                  tele: '',
                                  allowPublic: true,  // allow public user signup
                                  limitTransactions: false,  // unverified entities can only transact with other unverified entities // Type Boolean // 'true' to enable
                                  limitCreation: false,  // unverified entities can not create pools or other entities // Type Boolean // 'true' to enable
                                  capWordLength: 7,  // a cap on the number of words in an entity name that the system can handle
                                  maxEntityWords: 7,  // max allowed words in entity names (not humans) // MUST be less or equal to capWordLength
                                  maxHumanWords: 3,  // max allowed words in human entity names // MUST be less or equal to capWordLength
                                  maxWordLength: 12  // max allowed length of each word in name
                              }


exports.tokenDyn = {  // alpha.valueinstrument.org
                      baseTimeToZero: 60 * 60 * 24,  // token-lifetime in seconds // e.g. 60 * 60 * 24 is one day // Type Number (integer)
                      daysToZero: 120,  // multiplier for token-lifetime in days // this can ALSO be seconds, if baseTimeToZero is set to 1 // Type Number (integer)
                      payout: 24,  // regular payout amount // expressed in tokens // Type Number (integer)
                      payoutInterval: 60 * 60 * 24,  // regular payout interval // expressed in sec // Maximum delay value is 24 days // Type Number (integer)
                      initialBalance: 24 * 40,  // initial balance on new accounts // expressed in tokens // Type Number (integer)
                      updateVisFreq: 60 * 60,  // how often the user interface updates // expressed in sec // Type Number (integer)
                      setTxFee: 0.3333333333,  // transaction fee // e.g. 0.5 for 50%, can also be 0 // Type Number (decimal)
                  }

                   // see Alternative Token Dynamics below also

const i18n = require('./lang/' + exports.language);


exports.tokenDynDisplay = {  // refer to language files also
                             payoutTitle: i18n.strSysI110,  // Title for payout given as reference // Type String
                             intervalString: i18n.strSysI120,  // display interval string in community statistics // e.g. "daily", "weekly" etc... // Type String
                             tt0String: i18n.strSysI130,  // display time-to-zero info in community statistics // e.g. "1 day", "6 months" etc... // Type String
                             tt0StringTable: i18n.strSysI140,  // column title in tx history page for time-to-zero // e.g. "Days" // Type String
                             displayBurn: true,  // display burned amount in table in tx history page // 'true' to display // Type Boolean
                             displayTt0: true,  // display time-to-zero in table in tx history page // 'true' to display // Type Boolean
                          }

exports.taxPool = {  // refer to language files also
                     name: 'Tax',  // the community tax pool name // MUST be in one word // Type String
                     uPhrase: 'vxTXTestLogin', // corresponding community tax pool uPhrase // MUST start with "vpx" // Type String
                     tag: exports.initTag,
                     description: i18n.strSysI150,  // tax pool description // Type string
                     target: 20000,  // tax pool target // Type Number (integer)
                     ignition: 100,  // tax pool first balance // MUST be greater than 0 // Type Number (integer)
                     commTax: 0.15,  // taxation on transaction calculated FROM TX FEE (!) expressed in decimal number such as 0.1 for 10% // Type Number (decimal)
                     displayInPools: true,  // display tax pool in pools list // 'true' to display // Type Boolean
                     displayInStats: true,  // display tax pool balance in community stats // 'true' to display // Type Boolean
                  }

exports.poolGovernance = {
                            ignition: 100,  // new pool first balance expressed in tokens // Type Number (integer)
                            timeLimit: 60 * 60 * 24,  // time limit on requesting funds, expressed in seconds // Type Number (integer)
                            maxRequest: 100,  // limit of amount when requesting funds, expressed in tokens // Type Number (integer)
                            minTarget: 100,  // minimum target, expressed in tokens // MUST be greater than 0 // Type Number (integer)
                            taxOnTx: false,  // taxation on pool transactions? // 'true' to enable // Type Boolean
                            expires: 6,  // automatic pool expiry, expressed in months // Type Number (integer)
                            fillPeriod: 7,  // how long a pool can be filled, expressed in days // Type Number (integer)
                         }



/* Alternative Token Dynamics

exports.tokenDyn = {  // alpha.valueinstrument.org
                      baseTimeToZero: 60 * 60 * 24,  // token-lifetime in seconds // e.g. 60 * 60 * 24 is one day // Type Number (integer)
                      daysToZero: 120,  // multiplier for token-lifetime in days // this can ALSO be seconds, if baseTimeToZero is set to 1 // Type Number (integer)
                      payout: 24,  // regular payout amount // expressed in tokens // Type Number (integer)
                      payoutInterval: 60 * 60 * 24,  // regular payout interval // expressed in sec // Maximum delay value is 24 days // Type Number (integer)
                      initialBalance: 24 * 40,  // initial balance on new accounts // expressed in tokens // Type Number (integer)
                      updateVisFreq: 60 * 60,  // how often the user interface updates // expressed in sec // Type Number (integer)
                      setTxFee: 0.3333333333,  // transaction fee // e.g. 0.5 for 50%, can also be 0 // Type Number (decimal)
                  }


exports.tokenDyn = {  // Workshops
                      baseTimeToZero: 60,  // token-lifetime in seconds // e.g. 60 * 60 * 24 is one day // Type Number (integer)
                      daysToZero: 70,  // multiplier for token-lifetime in days // this can ALSO be seconds, if baseTimeToZero is set to 1 // Type Number (integer)
                      payout: 24,  // regular payout amount // expressed in tokens // Type Number (integer)
                      payoutInterval: 60 * 4,  // regular payout interval // expressed in sec // Maximum delay value is 24 days // Type Number (integer)
                      initialBalance: 24 * 12,  // initial balance on new accounts // expressed in tokens // Type Number (integer)
                      updateVisFreq: 60 * 2,  // how often the user interface updates // expressed in sec // Type Number (integer)
                      setTxFee: 0.3333333333,  // transaction fee // e.g. 0.5 for 50%, can also be 0 // Type Number (decimal)
                  }


exports.tokenDyn = {  // Fair Shares
                      baseTimeToZero: 60 * 60 * 24,  // token-lifetime in seconds // e.g. 60 * 60 * 24 is one day // Type Number (integer)
                      daysToZero: 360 * 200, // multiplier for token-lifetime in days // this can ALSO be seconds, if baseTimeToZero is set to 1 // Type Number (integer)
                      payout: 12,  // regular payout amount // expressed in tokens // Type Number (integer)
                      payoutInterval: 60 * 60 * 24,  // regular payout interval // expressed in sec // Maximum delay value is 24 days // Type Number (integer)
                      initialBalance: 12,  // initial balance on new accounts // expressed in tokens // Type Number (integer)
                      updateVisFreq: 60 * 60,  // how often the user interface updates // expressed in sec // Type Number (integer)
                      setTxFee: 0, // transaction fee // e.g. 0.5 for 50%, can also be 0 // Type Number (decimal)
                   }

*/
