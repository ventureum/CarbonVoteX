var CarbonVoteX = artifacts.require("./CarbonVoteX")
var MasterAddress = "0xa99e2f14effff4a0e811c6e0c3f915609ccfa0ef"

module.exports = function (deployer){
	deployer.deploy(CarbonVoteX, MasterAddress);
}
