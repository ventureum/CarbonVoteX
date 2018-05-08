const CarbonVoteX = artifacts.require("./CarbonVoteX");
const EIP20Token = artifacts.require("./EIP20Token");

contract('Test_CarbonVote', async (accounts)=>{

	it("Test Register", async ()=> {
		const CarbonVoteXInstance = await CarbonVoteX.deloyed();
		const EIP20TokenInstance = await EIP20Token.deployed();
		CarbonVoteXInstance.Register("100",100, 3000, EIP20Token.EIP20TokenInstance.address);
	});


});