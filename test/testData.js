
module.exports.constructUserName = [
  {arg: 'joe mcdonnell', expected: 'Joe McDonnell'},
  {arg: 'may macarthur', expected: 'May MacArthur'},
  {arg: ['martin', 'theodore', 'smith'], expected: 'Martin Theodore Smith'},
  {arg: 'pat', expected: 'Pat'}
];


module.exports.convertLinks = {
   textWithLinks: 'This link https://stackoverflow.com/questions/49634850/javascript-convert-plain-text-links-to-clickable-links/52544985#52544985 is clumsy and http://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split is not much better. This one www.apple.com is nice but www could be omitted',
   textResult: 'This link <a href="https://stackoverflow.com/questions/49634850/javascript-convert-plain-text-links-to-clickable-links/52544985#52544985" target="_blank">stackoverflow.com</a> is clumsy and <a href="http://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split" target="_blank">developer.mozilla.org</a> is not much better. This one <a href="http://www.apple.com" target="_blank">apple.com</a> is nice but www could be omitted'
};


module.exports.getBurned = [
  {
     entity: {onChain: { balance: 1000, lastMove: 1547845020, timeToZero: 8640000 /* 100 days */ }}, // simulated entity data
     timeSecondsUNIX: 1547845020 + 60 * 60 * 24 * 10, // simulated moment of new transaction
     burnedObj: { burnedBlocks: 60 * 60 * 24 * 10, burnedBalance: 900, burnedDelta: 100, remainingTimeToZero: 7776000 }
  },
];


module.exports.findEntities = [ 'send', 'Thomas', 'Blake', '#2121', '45']


module.exports.testEntities = [
   {
      "credentials":{
         "name":"Value",
         "tag":"#2121",
         "uPhrase":"vxVITestLogin",
         "role":"community",
         "status":"active",
         "socketID":"offline"
      },
      "profile":{
         "joined":"2019-01-20T16:53:17.195Z",
         "lastLogin":"2019-01-20T16:53:17.195Z",
         "loginExpires":"2039-01-20T16:53:17.050Z",
         "timeZone":""
      },
      "onChain":{
         "balance":9000,
         "lastMove":1548003197,
         "timeToZero":10368000
      },
      "stats":{
         "sendVolume":0,
         "receiveVolume":0,
         "allTimeVolume":0
      },
      "_id":"5c44a77db5eac89df7644f2d",
      "fullId":"Value #2121",
      "owners":[
         {
            "_id":"5c44a77db5eac89df7644f2e",
            "ownerName":"Anna Blume",
            "ownerTag":"#2121"
         }
      ],
      "admins":[
         {
            "_id":"5c44a77db5eac89df7644f2f",
            "adminName":"Anna Blume",
            "adminTag":"#2121"
         }
      ],
      "__v":0
   },
   {
      "credentials":{
         "name":"Tax",
         "tag":"#2121",
         "uPhrase":"vxTXTestLogin",
         "role":"taxpool",
         "status":"active",
         "socketID":"offline"
      },
      "profile":{
         "joined":"2019-01-20T16:53:17.199Z",
         "lastLogin":"2019-01-20T16:53:17.199Z",
         "loginExpires":"2039-01-20T16:53:17.050Z",
         "timeZone":""
      },
      "properties":{
         "description":"This pool collects transaction tax. A percentage of the transaction fee of each transfer in this network will go here and be available for community use.",
         "creator":"Value",
         "creatorTag":"#2121",
         "created":"2019-01-20T16:53:17.050Z",
         "fillUntil":"2039-01-20T16:53:17.050Z",
         "expires":"2039-01-20T16:53:17.050Z",
         "target":20000
      },
      "onChain":{
         "balance":960,
         "lastMove":1548003197,
         "timeToZero":10368000
      },
      "stats":{
         "sendVolume":0,
         "receiveVolume":0
      },
      "_id":"5c44a77db5eac89df7644f33",
      "fullId":"Tax #2121",
      "owners":[
         {
            "_id":"5c44a77db5eac89df7644f34",
            "ownerName":"Value",
            "ownerTag":"#2121"
         }
      ],
      "admins":[
         {
            "_id":"5c44a77db5eac89df7644f35",
            "adminName":"Value",
            "adminTag":"#2121"
         }
      ],
      "__v":0
   },
   {
      "credentials":{
         "name":"Walther Blake",
         "tag":"#2121",
         "uPhrase":"vxiZ8ctagtmsz1gdvnAABt",
         "role":"member",
         "status":"active",
         "socketID":"ta4r7BCo2wMcIBEoAAAF"
      },
      "profile":{
         "joined":"2019-01-20T16:53:17.263Z",
         "lastLogin":"2019-01-20T16:53:17.471Z",
         "loginExpires":"2020-03-20T16:53:17.471Z",
         "timeZone":"Europe/Berlin"
      },
      "onChain":{
         "balance":960,
         "lastMove":1548003197,
         "timeToZero":10368000
      },
      "stats":{
         "sendVolume":0,
         "receiveVolume":0
      },
      "_id":"5c44a77db5eac89df7644f41",
      "fullId":"Walther Blake #2121",
      "owners":[
         {
            "_id":"5c44a77db5eac89df7644f42",
            "ownerName":"Walther Blake",
            "ownerTag":"#2121"
         }
      ],
      "admins":[
         {
            "_id":"5c44a77db5eac89df7644f43",
            "adminName":"Walther Blake",
            "adminTag":"#2121"
         }
      ],
      "__v":0
   },
   {
      "credentials":{
         "name":"Thomas Blake",
         "tag":"#2121",
         "uPhrase":"vxiZ8ctNNKmsz1gdvnAABt",
         "role":"member",
         "status":"active",
         "socketID":"offline"
      },
      "profile":{
         "joined":"2019-01-20T16:53:17.190Z",
         "lastLogin":"2019-01-20T16:53:17.190Z",
         "loginExpires":"2021-01-20T16:53:17.050Z",
         "timeZone":""
      },
      "onChain":{
         "balance":960,
         "lastMove":1548003197,
         "timeToZero":10368000
      },
      "stats":{
         "sendVolume":0,
         "receiveVolume":0
      },
      "_id":"5c44a77db5eac89df7644f2a",
      "fullId":"Thomas Blake #2121",
      "owners":[
         {
            "_id":"5c44a77db5eac89df7644f2b",
            "ownerName":"Thomas Blake",
            "ownerTag":"#2121"
         }
      ],
      "admins":[
         {
            "_id":"5c44a77db5eac89df7644f2c",
            "adminName":"Thomas Blake",
            "adminTag":"#2121"
         }
      ],
      "__v":0
   }
]
