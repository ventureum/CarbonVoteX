const CarbonVoteX = artifacts.require("./CarbonVoteX");
const EIP20Token = artifacts.require("./EIP20Token");

contract('Test_CarbonVote', async (accounts)=>{

	it("Test register and getPoll", async ()=> {
		const CarbonVoteXInstance = await CarbonVoteX.deployed();
		const EIP20TokenInstance = await EIP20Token.deployed();

		console.log("CarbonVoteX deployed at:",CarbonVoteXInstance.address);

		await CarbonVoteXInstance.register("333","444", "30000000", EIP20TokenInstance.address);
		const poll = await CarbonVoteXInstance.getPoll("333");
		console.log("pollid: ", poll);

	});

	it("Test WriteAvailableVote", async () =>{

		const CarbonVoteXInstance = await CarbonVoteX.deployed();
		const EIP20TokenInstance = await EIP20Token.deployed();

		const choice = "11";
		const pollId = "333";

		console.log("In test2 CarbonVoteX deployed at:",CarbonVoteXInstance.address);

		await CarbonVoteXInstance.writeAvailableVotes(pollId, accounts[0], "1000");
		const bvotes = await CarbonVoteXInstance.readAvailableVotes(pollId, accounts[0]);
		console.log ("Votes before voting: ",bvotes.toString(10));

		await CarbonVoteXInstance.vote(pollId,choice, "500");

		const avotes = await CarbonVoteXInstance.readAvailableVotes(pollId, accounts[0]);
		console.log ("Votes after voting: ",avotes.toString(10));

		const result = await CarbonVoteXInstance.getVotingResult(pollId,accounts[0],choice);
		console.log ("Voter: ", accounts[0], " voted ", result.toString(10) , "tokens with choice of ",choice, " in poll ", pollId);


	} );




});
