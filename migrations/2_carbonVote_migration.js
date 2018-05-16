var CarbonVoteXCore = artifacts.require("./CarbonVoteXCore");
var CarbonVoteXBasic = artifacts.require("./CarbonVoteXBasic");
var Web3 = require ('web3');
var web3 = new Web3();

module.exports = function (deployer, network, accounts){
  
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
  deployer.deploy(CarbonVoteXCore, accounts[1]);
	deployer.deploy(CarbonVoteXBasic, web3.utils.sha3('simple-namespace'), CarbonVoteXCore.address);
  core = await CarbonVoteXCore.deployed();
  await core.setPermissions([web3.utils.sha3("register")], [CarbonVoteXBasic.address]);
}
