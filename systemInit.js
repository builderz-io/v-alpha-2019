
exports.production = false;  // resets or keeps database when restarting app // Type Boolean // 'false' to reset

exports.poolModule = true;  // enables/disables Pool Plugin // Type Boolean // 'true' to enable

exports.geoModule = true;   // enables/disables Location Plugin // Type Boolean // 'true' to enable

exports.contributionModule = true;   // enables/disables Contribution Plugin // Type Boolean // 'true' to enable

exports.language = 'en-US';  // sets the app-language // Type String // e.g. en US for English, de DE for German

exports.admins = [  // add objects for each admin

                 {
                     name: 'Thomas',  // the community admin name // MUST be in one word // Type String // choose your preferred admin name
                     tag: '#2000',  // the community admin tag // MUST be 4 digits receded by '#' , e.g. '#2000' // Type String
                     uPhrase: 'vxiZ8ctAZDlaz1gdvnAABt', // corresponding admin uPhrase // MUST start with "vx" // Type String // choose your preferred phrase
                 },

                 {
                     name: 'Anna',
                     tag: '#2000',
                     uPhrase: 'vxiZ8ctAZDlaz2gdvnAABt',
                 },

               ];

exports.communityGovernance = {
                                  commName: 'Value',  // the community name // MUST be in one word // Type String
                                  commTag: '#2000',  // the community tag // MUST be 4 digits receded by '#' , e.g. '#2000' // Type String
                                  commuPhrase: 'vxiZ0ctNNKmsz0gdvnAABt',  // corresponding community uPhrase // MUST start with "vx" // Type String
                                  commIgnition: 900,  // token amount for community account at start // Type Number (integer)
                                  fb: 'valueinstrument',  // Social Media Links // Type String
                                  tw: 'valueinstrument',
                                  web: 'valueinstrument.org',
                                  tele: '',
                              }

exports.tokenDyn = {  // alpha.valueinstrument.org
                      baseTimeToZero: 60 * 60 * 24,  // token-lifetime in seconds // e.g. 60 * 60 * 24 is one day // Type Number (integer)
                      daysToZero: 120,  // multiplier for token-lifetime in days // this can ALSO be seconds, if baseTimeToZero is set to 1 // Type Number (integer)
                      payout: 24,  // regular payout amount // expressed in tokens // Type Number (integer)
                      payoutInterval: 60 * 60 * 24,  // regular payout interval // expressed in sec // Maximum delay value is 24 days // Type Number (integer)
                      initialBalance: 24 * 40,  // initial balance on new accounts // expressed in tokens // Type Number (integer)
                      updateVisFreq: 60 * 15,  // how often the user interface updates // expressed in sec // Type Number (integer)
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
                     tag: '#2000',
                     uPhrase: 'vxiZ9ctAZDlaz9gdvnAABt', // corresponding community tax pool uPhrase // MUST start with "vpx" // Type String
                     description: i18n.strSysI150,  // tax pool description // Type string
                     target: 0,  // tax pool target // Type Number (integer)
                     ignition: 1,  // tax pool first balance // MUST be greater than 0 // Type Number (integer)
                     commTax: 0.15,  // taxation on transaction calculated FROM TX FEE (!) expressed in decimal number such as 0.1 for 10% // Type Number (decimal)
                     displayInPools: true,  // display tax pool in pools list // 'true' to display // Type Boolean
                     displayInStats: true,  // display tax pool balance in community stats // 'true' to display // Type Boolean
                  }

exports.poolGovernance = {
                            ignition: 7,  // new pool first balance expressed in tokens // Type Number (integer)
                            timeLimit: 60 * 60 * 24,  // time limit on requesting funds, expressed in seconds // Type Number (integer)
                            maxRequest: 100,  // limit of amount when requesting funds, expressed in tokens // Type Number (integer)
                            minTarget: 1,  // minimum target, expressed in tokens // MUST be greater than 0 // Type Number (integer)
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
