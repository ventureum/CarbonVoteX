var CarbonVoteX = artifacts.require("./CarbonVoteX")
var MasterAddress = "0x161154e1ee56b1254dc54f5f36b72b86a8325e75"

module.exports = function (deployer){
	deployer.deploy(CarbonVoteX, MasterAddress);
}
