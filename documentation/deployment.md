# Value Instrument Alpha

# Deployment of the app

Use Ubuntu, Nginx, PM2 or the like to run this on a public server.

Setup your preferred settings in

```
systemInit.js
```

Set "production" from false to true, once you wish to run the install without dropping the database on system restarts

```
exports.production = true

```

The minimum you should set in a live environment are the following credentials. The other settings are decent presets and can be explored later.

```
exports.admins = [

                 {
                     name: 'Your Name',  // MUST be no more than words
                     uPhrase: 'vxAnyPassPhrase' // MUST start with "vx"
                 },

               ];

 exports.communityGovernance = {
                                   commName: 'Your Community',  // MUST be no more than words
                                   commuPhrase: 'vxAnySecondPassPhrase',   // MUST start with "vx"
                               }


exports.taxPool = {
                    name: 'Tax', // MUST be no more than words
                    uPhrase: 'vxAnyThirdPassPhrase', // MUST start with "vx"
                 }

```

Set "communityRules" from false to true, if you wish to limit capabilities of new users (recommended in live environments)

```
exports.communityRules = {
                             limitTransactions: false,  
                             limitCreation: false,
                         }
```
