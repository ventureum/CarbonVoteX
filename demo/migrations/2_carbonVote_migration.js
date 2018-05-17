var CarbonVoteX = artifacts.require("./CarbonVoteX");
var BasicTokenMock = artifacts.require("./BasicTokenMock");
var config = require("../conf/config.json");
var Web3 = require ('web3');
var web3 = new Web3();

module.exports = function (deployer, network, accounts) {
    var AuthorziedAddress = [
        accounts[2],
        accounts[3],
        accounts[4]
    ];
    var restrictedFunctions = [
        web3.utils.sha3("register"),
        web3.utils.sha3("voteFor"),
        web3.utils.sha3("sendGas")
    ];


    var InitialAccountSet = [
        accounts[0]
    ];
    for (var i = 1; i < config.initial_account_number; i++) {
        InitialAccountSet.push(accounts[i]);
    }

    deployer.deploy(CarbonVoteX, accounts[1],restrictedFunctions, AuthorziedAddress);
    deployer.deploy(BasicTokenMock, InitialAccountSet, config.initial_balance);
}
