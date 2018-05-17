require('dotenv').config()

// babel does not transpile js in node_modules, we need to ignore them
require('babel-register')({
  ignore: /node_modules\/(?!openzeppelin-solidity\/test\/helpers)/
})
require('babel-polyfill')

var HDWalletProvider = require("truffle-hdwallet-provider");
let mnemonic = "";
let providerUrl = "http://localhost:8545";
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 5000000,
      provider: new HDWalletProvider(mnemonic, providerUrl, 0, 6)
    }
  }
};
