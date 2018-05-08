var HDWalletProvider = require("truffle-hdwallet-provider");
const mnemonic = "loop include whale off rule whip betray report grief cancel gadget park";
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 5000000,
      provider: new HDWalletProvider(mnemonic, "http://localhost:8545")
    }
  }
};
