# Value Instrument Alpha

This repository includes an implementation of the Value Instrument's four principles in monetary design, that aim to stimulate economic activity in communities.

This alpha version is coded with blockchain technology in mind, yet it does not run on or connect to any blockchain in its current state.

Installing and running this alpha will give you an online-banking-web-app with a chat-like user interface.

### Principles presented in this alpha

* You get Value on a regular basis.
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

### Installing

Open a Terminal window and run the follwing commands.

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

To start the backend

```
node vi-alpha.js
```


To run the frontend use any browser and access

```
localhost:3021
```

Setup test-users across several browsers to send Value between these users.



## Deployment

Use Ubuntu, Nginx, PM2 or the like to run this on a public server.


## Built With

* node.js
* express.js
* socket.io
* d3.js
* monent.js
* MongoDB / mongoose.js


## Authors

* **Philipe Achille Villers** - *Initial alpha coding* - [philipeachille](https://github.com/philipeachille)


## License

This project is licensed under the Apache 2.0 license - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgements

* We are grateful to the many developers building the tools and applications, that make it possible to publish this Alpha Version.
