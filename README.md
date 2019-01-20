# Value Instrument Alpha

# Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

This repository includes an implementation of the Value Instrument's four principles for monetary design, that aim to stimulate economic activity in communities. This alpha version is coded with blockchain technology in mind, yet it does not run on or connect to any blockchain in its current state.

Installing and running this alpha will give you an online-banking-web-app with a chat-like user interface.

You will be able to experience a demurrage-token first hand!

## Principles presented in this alpha

* You get a payout on a regular basis.
* You burn the amounts received, if not used within their lifetime.
* Your received amounts always have fully renewed lifetime.
* You pay a transaction fee, to avoid ping-pong transfers for regaining new lifetime.


## Documentation and further reading

Refer to the documentation folder.


## Prerequisites

- You need node.js installed and running.

```
https://nodejs.org/en/
```

- You need MongoDB installed and running.

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



## Installing

Open a Terminal window and run the following commands.

Clone this repository into a local folder. A new folder will be created.

```
git clone https://github.com/valueinstrument/vi-alpha.git
```

Navigate to the new folder

```
cd vi-alpha
```
Optinally change git branch before installing dependencies

```
git checkout branch-name
```

Install dependencies

```
npm install
```


## Starting the application

To start the backend

```
node v-alpha-app.js
```

To run the frontend use any browser and access

```
localhost:3021
```


## Testing, Managing Accounts and Transacting

Setup test-accounts across several browsers with up to 3 words as their name and send funds between these accounts.

The accounts also get the tag \#2121 assigned automatically.

Sending funds is triggered by entering one of the following commands into the chat message field:

```
send 5 to your-chosen-name-here #2121 | send your-chosen-name-here #2121 53 | +5 your-chosen-name-here #2121
```

Refer to the manual.md in the documentation folder to find out more about tags, commands and other functionalities


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


## Code Structure

db - Includes MongoDB database schemas

documentation - Includes files for further reading, like manuals, concepts and workflows

functions - Includes node files / functionalities
- transaction-mongodb - Includes node files related to initiating transactions and storing them in MongoDB (only)

lang - Includes translation files for node files

public - Includes all frontend files, as well as "plugin files"
- css - Includes frontend css rules
- js - Includes frontend scripts
- lang - Includes frontend translation files
- plugins - Includes node and frontend files for additional functionalities

resources - Includes Ethereum files


## Deployment

Refer to [deployment.md](deployment.md) in the documentation folder.


## Built With

* node.js
* express.js
* socket.io
* moment.js
* MongoDB / mongoose.js
... and many other code-snippets, credited in the code where appropriate


## Authors

* **Philipe Achille Villiers** - *Initial alpha coding* - [philipeachille](https://github.com/philipeachille)


## License

This project is licensed under the Apache 2.0 license - see the [LICENSE.md](LICENSE.md) file for details

Code included in the "Plugins" folder may be NOT be licensed under the Apache 2.0 license and instead subject to copyright!


## Acknowledgements

We are grateful to the many developers building the tools and applications that make it possible to publish this Alpha Version of the Value Instrument.
