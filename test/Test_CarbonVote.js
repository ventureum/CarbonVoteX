// accounts setting in this test environment:
// by the nature of DSAuth and DSGuard, accounts[0] has root power. 
// account[1] is master account, it can call writeAvailableVote
// account[2] can register
// account[3] can voteFor
// account[4] can sendGas
// account [5] can only call non-restricted functions.

import EVMRevert from 'openzeppelin-solidity/test/helpers/EVMRevert';

const CarbonVoteX = artifacts.require("./CarbonVoteX");
const TokenAddress = "0x337cDDa6D41A327c5ad456166CCB781a9722AFf9";
const keccak256 = require('js-sha3').keccak256;
var BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Test_CarbonVote', async (accounts) => {
	let carbonVoteXInstance;
	const existPollId = "0x0000000000000000000000000000000000000000000000000000000000000001";
	beforeEach(async ()=>{
		carbonVoteXInstance = await CarbonVoteX.deployed();
	});

	it("Test register and getPoll", async () => {
		const startBlock = "50000";
		const endBlock = "30000000";
		
		// Regiter a new poll;
		await carbonVoteXInstance.register(startBlock, endBlock, existPollId, TokenAddress, {from: accounts[2]});
		const poll = await carbonVoteXInstance.getPoll(existPollId);
		assert.equal(startBlock, poll[0].toString(10), "Register startBlock failed");
		assert.equal(endBlock, poll[1].toString(10), "Register endBlock failed");
		assert.equal(parseInt(existPollId, 16), parseInt(poll[2], 16), "Register pollId failed");
		assert.equal(parseInt(TokenAddress), parseInt(poll[3], 16), "Register token address failed");
	});

	it("Test writeAvailableVotes", async () => {
		const choice = "11";
		const votingRight = "1000";

		// write available votes to a account
		await carbonVoteXInstance.writeAvailableVotes(existPollId, accounts[0], votingRight, {from: accounts[1]});
		const available = await carbonVoteXInstance.readAvailableVotes(existPollId, accounts[0]);
		// assert the account has received voting right.
		assert.equal("1000", available.toString(10), "Incorrect voting right received by account")
	});

	it ("Test voting", async () => {
		const choice = "11";
		// the amount of votes
		const votes = "500";

		await carbonVoteXInstance.vote(existPollId,choice, votes);
		const remain = await carbonVoteXInstance.readAvailableVotes(existPollId, accounts[0]);
		const result = await carbonVoteXInstance.getVotingResultByVoter(existPollId,accounts[0],choice);

		// check remaining available voting right.
		// execpt 1000 - 500 = 500.
		assert.equal("500", remain.toString(10), "Incorrect remaining voting right");
		assert.equal("500", result.toString(10), "Incorrect voting result");
	});

	it ("Test getVotingResult", async () => {
		const votedChoice = "11";
		const unvotedChoice = "22";

		// get voting result.
		const result = await carbonVoteXInstance.getVotingResult(existPollId, votedChoice);
		const zeroResult = await carbonVoteXInstance.getVotingResult(existPollId, unvotedChoice);
		assert ("500", result.toString(10), "Incorrect voting result");
		assert ("0", zeroResult.toString(10), "Incorrect voting result");
	});

	describe ("testing DSAuth:", () => {
		it ("only accounts[1] can call writeAvailableVotes",
			async () =>{
				const availableVotes = 1500;
				await carbonVoteXInstance.writeAvailableVotes(
					existPollId, 
					accounts[1],
					availableVotes, 
					{from: accounts[1]}
				)

				await carbonVoteXInstance.writeAvailableVotes(
					existPollId, 
					accounts[1],
					availableVotes, 
					{from: accounts[2]}
				)
				.should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.writeAvailableVotes(
					existPollId, 
					accounts[1],
					availableVotes, 
					{from: accounts[3]}
				)
				.should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.writeAvailableVotes(
					existPollId, 
					accounts[1],
					availableVotes, 
					{from: accounts[4]}
				)
				.should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.writeAvailableVotes(
					existPollId, 
					accounts[1],
					availableVotes, 
					{from: accounts[5]}
				)
				.should.be.rejectedWith(EVMRevert);
		});

		// accounts[2]
		it ("only accounts[2] can call restricted function register",
			async () =>{
				const existPollId2 = "0x0000000000000000000000000000000000000000000000000000000000000002";
				const startBlock = "50000";
				const endBlock = "30000000";
				await carbonVoteXInstance.register(
					startBlock, 
					endBlock, 
					existPollId2, 
					TokenAddress, 
					{from: accounts[2]});

				await carbonVoteXInstance.register(
					startBlock, 
					endBlock, 
					existPollId2, 
					TokenAddress, 
					{from: accounts[1]}
				)
				.should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.register(
					startBlock, 
					endBlock, 
					existPollId2, 
					TokenAddress, 
					{from: accounts[3]}
				)
				.should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.register(
					startBlock, 
					endBlock, 
					existPollId2, 
					TokenAddress, 
					{from: accounts[4]}
				)
				.should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.register(
					startBlock, 
					endBlock, 
					existPollId2, 
					TokenAddress, 
					{from: accounts[5]}
				)
				.should.be.rejectedWith(EVMRevert);
		});

		// account[3];
		it ("accounts[3] can call restricted function voteFor",
			async () =>{
				const choice = "11";
				const votes = "500";
				await carbonVoteXInstance.voteFor(
					existPollId, 
					accounts[1], 
					choice, 
					votes, 
					{from: accounts[3]}
				);

				await carbonVoteXInstance.voteFor(
					existPollId, 
					accounts[1], 
					choice, 
					votes, 
					{from: accounts[1]}
				)
				.should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.voteFor(
					existPollId, 
					accounts[1], 
					choice, 
					votes, 
					{from: accounts[2]}
				)
				.should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.voteFor(
					existPollId, 
					accounts[1], 
					choice, 
					votes, 
					{from: accounts[4]}
				)
				.should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.voteFor(
					existPollId, 
					accounts[1], 
					choice, 
					votes, 
					{from: accounts[5]}
				)
				.should.be.rejectedWith(EVMRevert);
		});

		it ("account[4] can call restricted function sendGas",
			async () => {
				await carbonVoteXInstance.sendGas(existPollId, {from: accounts[4]});
				await carbonVoteXInstance.sendGas(existPollId, {from: accounts[1]}).should.be.rejectedWith(EVMRevert);
				await carbonVoteXInstance.sendGas(existPollId, {from: accounts[2]}).should.be.rejectedWith(EVMRevert);
				await carbonVoteXInstance.sendGas(existPollId, {from: accounts[3]}).should.be.rejectedWith(EVMRevert);
				await carbonVoteXInstance.sendGas(existPollId, {from: accounts[5]}).should.be.rejectedWith(EVMRevert);
		});

		//TODO: add more unit tests for DSAuth.
	});

	describe("operations to non-exist poll", () => {
		it ("should fail when sendGas", async () => {
			await carbonVoteXInstance.sendGas("0xa").should.be.rejectedWith(EVMRevert);
		});

		// it("should fail when getGasSent (not )", async () => {
		// 	// TODO:
		// 	const result = await carbonVoteXInstance.getGasSent("0xa1", accounts[0]);
		// 	console.log("returned :", result.toString(10));
		// });

		// TODO: more tests 
	}); 
})
