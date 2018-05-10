var CarbonVoteX = artifacts.require("./CarbonVoteX")
var MasterAddress = "0xa9B0cF09F88B95cE9596524bD15147f8664B85bF"
module.exports = function (deployer){
	deployer.deploy(CarbonVoteX, MasterAddress);
}