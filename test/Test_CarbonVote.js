const CarbonVoteX = artifacts.require("./CarbonVoteX");
const TokenAddress = "0x337cDDa6D41A327c5ad456166CCB781a9722AFf9";
const keccak256 = require('js-sha3').keccak256;

contract('Test_CarbonVote', async (accounts) => {
	it("Test register and getPoll", async () => {
		const carbonVoteXInstance = await CarbonVoteX.deployed();

		const startBlock = "5000";
		const endBlock = "30000000";
		const pollId = "0x0000000000000000000000000000000000000000000000000000000000000001";
		// Regiter a new 
		await carbonVoteXInstance.register(startBlock, endBlock, pollId, TokenAddress);
		const poll = await carbonVoteXInstance.getPoll(pollId);
		assert.equal(startBlock, poll[0].toString(10), "Register startBlock failed");
		assert.equal(endBlock, poll[1].toString(10), "Register endBlock failed");
		assert.equal(parseInt(pollId, 16), parseInt(poll[2], 16), "Register pollId failed");
		assert.equal(parseInt(TokenAddress), parseInt(poll[3], 16), "Register token address failed");
	});

	it("Test writeAvailableVotes", async () => {
		const carbonVoteXInstance = await CarbonVoteX.deployed();
		const choice = "11";
		const pollId = "0x0000000000000000000000000000000000000000000000000000000000000001";
		const votingRight = "1000";

		// write available votes to a account
		await carbonVoteXInstance.writeAvailableVotes(pollId, accounts[0], votingRight);
		const available = await carbonVoteXInstance.readAvailableVotes(pollId, accounts[0]);
		// assert the account has received voting right.
		assert.equal("1000", available.toString(10), "Incorrect voting right received by account")
	});

	it ("Test voting", async () => {
		const carbonVoteXInstance = await CarbonVoteX.deployed();
		const choice = "11";
		const pollId = "0x0000000000000000000000000000000000000000000000000000000000000001";
		// the amount of votes
		const votes = "500";

		await carbonVoteXInstance.vote(pollId,choice, votes);
		const remain = await carbonVoteXInstance.readAvailableVotes(pollId, accounts[0]);
		const result = await carbonVoteXInstance.getVotingResultByVoter(pollId,accounts[0],choice);

		// check remaining available voting right.
		// execpt 1000 - 500 = 500.
		assert.equal("500", remain.toString(10), "Incorrect remaining voting right");
		assert.equal("500", result.toString(10), "Incorrect voting result");
	});

	it ("Test getVotingResult", async () => {
		const carbonVoteXInstance = await CarbonVoteX.deployed();
		const pollId = "0x0000000000000000000000000000000000000000000000000000000000000001";
		const votedChoice = "11";
		const unvotedChoice = "22";

		// get voting result.
		const result = await carbonVoteXInstance.getVotingResult(pollId, votedChoice);
		const zeroResult = await carbonVoteXInstance.getVotingResult(pollId, unvotedChoice);
		assert ("500", result.toString(10), "Incorrect voting result");
		assert ("0", zeroResult.toString(10), "Incorrect voting result");
	});
})
