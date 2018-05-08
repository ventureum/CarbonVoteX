var CarbonVoteX = artifacts.require("./CarbonVoteX")
var EIP20Token = artifacts.require("./EIP20Token")

module.exports = function (deployer){
	deployer.deploy(EIP20Token, "10000000000");
	deployer.deploy(CarbonVoteX, "0xa9B0cF09F88B95cE9596524bD15147f8664B85bF");

	// deployer.then(async()=>{
	// 	const tokenInstance =  await EIP20Token.deployed();
	// 	console.log ("deployed token: ", tokenInstance.address);
	// 	await tokenInstance.transfer( "0xa9B0cF09F88B95cE9596524bD15147f8664B85bF", 100);
	// 	console.log("transfered");
	// 	const balance= await tokenInstance.balanceOf("0xa9B0cF09F88B95cE9596524bD15147f8664B85bF");
	// 	console.log("Balance got:", balance.toString(10));
		



	// 	const CarbonVoteXInstance = await CarbonVoteX.deployed();
	// 	await CarbonVoteXInstance.register("100","150","150","0xa9B0cF09F88B95cE9596524bD15147f8664B85bF");
	// 	const result = CarbonVoteXInstance.pollExist("100");
	// 	assert.equal(result, true);

	// 	}
	// );

}