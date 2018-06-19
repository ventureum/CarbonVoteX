var CarbonVoteXCore = artifacts.require("./CarbonVoteXCore");
var CarbonVoteXBasic = artifacts.require("./CarbonVoteXBasic");
var Web3 = require ('web3');
var web3 = new Web3();

module.exports = function (deployer, network, accounts){
 	deployer.deploy(CarbonVoteXCore, accounts[1])
 	.then(() =>{
 			return deployer.deploy(
 				CarbonVoteXBasic, 
 				web3.utils.sha3('simple-namespace'), 
 				CarbonVoteXCore.address
 			);
 	});
}
