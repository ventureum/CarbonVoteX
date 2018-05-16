require('dotenv').config()

// babel does not transpile js in node_modules, we need to ignore them
require('babel-register')({
  ignore: /node_modules\/(?!openzeppelin-solidity\/test\/helpers)/
})
require('babel-polyfill')

var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "loop include whale off rule whip betray report grief cancel gadget park";
// [ '0xa9b0cf09f88b95ce9596524bd15147f8664b85bf',
//   '0x12088237be120f6516287a74fc01b60935b1cf89',
//   '0x99c871d2a36b6965230b6c0ecd259a28da2809e0',
//   '0x41284ee87fed1013ea313caa435ff0fbee887dbf',
//   '0xe23abfc1f558aa08cfe664af63c3a214d1f95290',
//   '0x7983d0e92ddf62719c44b34aadbf9f8156f97ece' ]
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 5000000,
      provider: new HDWalletProvider(mnemonic, "http://localhost:8545",0, 6)
    }
  }
};
