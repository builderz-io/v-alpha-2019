# Value Instrument Alpha

This repository includes an implementation of the Value Instrument's four principles for monetary design, that aim to stimulate economic activity in communities. This alpha version is coded with blockchain technology in mind, yet it does not run on or connect to any blockchain in its current state.

Installing and running this alpha will give you an online-banking-web-app with a chat-like user interface.

You will be able to experience a demurrage-token first hand!

### Principles presented in this alpha

* You get a payout on a regular basis.
* You burn the amounts received, if not used within their lifetime.
* Your received amounts always have fully renewed lifetime.
* You pay a transaction fee, to avoid ping-pong transfers for regaining new lifetime.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.


### Prerequisites

You need MongoDB installed and running.

Linux
```
https://docs.mongodb.com/manual/administration/install-on-linux/
```

OS X
```
https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/
```

Windows
```
https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
```

You need node.js installed and running.

```
https://nodejs.org/en/
```

### Installing

Open a Terminal window and run the following commands.

Clone this repository into a local folder. A new folder will be created.

```
git clone https://github.com/valueinstrument/vi-alpha.git
```

Navigate to the new folder

```
cd vi-alpha
```

Install dependencies

```
npm install
```

Rename systemInit-example.js to systemInit.js and setup your preferred settings. The minimum you should set are the following details, the other settings are decent presets and can be explored later.

```
exports.admins = [

                 {
                     name: 'YourName',  
                     uPhrase: 'vxAnyPassPhrase'
                 },

               ];

 exports.communityGovernance = {
                                   commName: 'Your Community',
                                   commuPhrase: 'vxAnyOtherPassPhrase',  
                               }


```


To start the backend

```
node v-alpha-app.js
```


To run the frontend use any browser and access

```
localhost:3021
```


## Testing

Setup test-users across several browsers to send Value between these users.


## Setting the language

Set the language codes in systemInit.js and index.html:

- 'en-US' for English
- 'de-DE' for German

In systemInit.js:

```
exports.language = 'en-US'

```

In index.html:

```
src="lang/en-US.js"
```

and

```
var appLang="en-US.js"

```

## Deployment

Use Ubuntu, Nginx, PM2 or the like to run this on a public server.

In systemInit.js set "production" from false to true, once you wish to run the install without dropping the database on system restarts

```
exports.production = true

```

## Built With

* node.js
* express.js
* socket.io
* moment.js
* MongoDB / mongoose.js


## Authors

* **Philipe Achille Villiers** - *Initial alpha coding* - [philipeachille](https://github.com/philipeachille)


## License

This project is licensed under the Apache 2.0 license - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgements

We are grateful to the many developers building the tools and applications that make it possible to publish this Alpha Version of the Value Instrument.
