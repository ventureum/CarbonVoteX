const CarbonVoteX = artifacts.require("./CarbonVoteX");
const EIP20Token = artifacts.require("./EIP20Token");

contract('Test_Token', async (accounts)=>{

	it("Test Transfer", async ()=> {
		const tokenInstance =  await EIP20Token.deployed();
		console.log ("deployed token: ", tokenInstance.address);
		await tokenInstance.transfer( "0xa9B0cF09F88B95cE9596524bD15147f8664B85bF", 100);
		console.log("transfered");
		const balance= await tokenInstance.balanceOf("0xa9B0cF09F88B95cE9596524bD15147f8664B85bF");
		console.log("Balance got:", balance.toString(10));
	});


	it ("Test CarbonVoteX Register", async ()=>{
		const CarbonVoteXInstance = await CarbonVoteX.deployed();
		console.log("CarbonVoteX deploed at: ", CarbonVoteXInstance.address);
		


	});

	});