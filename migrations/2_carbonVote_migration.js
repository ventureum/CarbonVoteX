var CarbonVoteX = artifacts.require("./CarbonVoteX")
var MasterAddress = "0xb3e8a537f6753767a677263879597261209c8a49"
module.exports = function (deployer){
	deployer.deploy(CarbonVoteX, MasterAddress);
}
