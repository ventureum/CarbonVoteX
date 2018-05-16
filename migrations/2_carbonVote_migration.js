var CarbonVoteX = artifacts.require("./CarbonVoteX");
var Web3 = require ('web3');
var web3 = new Web3();

module.exports = function (deployer, network, accounts){
	console.log(accounts);
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
	deployer.deploy(CarbonVoteX,accounts[1],restrictedFunctions, AuthorziedAddress);
}
