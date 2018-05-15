import EVMRevert from 'openzeppelin-solidity/test/helpers/EVMRevert';

const CarbonVoteX = artifacts.require("./CarbonVoteX");
const TokenAddress = "0x337cDDa6D41A327c5ad456166CCB781a9722AFf9";
var BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Test_CarbonVote', async (accounts) => {
	let carbonVoteXInstance;
	const EXISTNG_POLL_ID = "0x0000000000000000000000000000000000000000000000000000000000000001";
	// accounts setting in this test environment:
	// by the nature of DSAuth and DSGuard, accounts[0] has root power. 
	// accounts[1] is master account, it can call writeAvailableVote
	// accounts[2] can register
	// accounts[3] can voteFor
	// accounts[4] can sendGas
	// accounts[5] can only call non-restricted functions.
	const ROOT_ACCOUNT = accounts[0];
	const MASTER_ACCOUNT = accounts[1];
	const REGISTER_ACCOUNT = accounts[2];
	const VOTE_FOR_ACCOUNT = accounts[3];
	const SEND_GAS_ACCOUNT = accounts[4];
	const UNAUTHORIZED_ACCOUNT = accounts[5];

	beforeEach(async ()=>{
		carbonVoteXInstance = await CarbonVoteX.deployed();
	});

	it("Test register and getPoll", async () => {
		const startBlock = "50000";
		const endBlock = "30000000";
		
		// Regiter a new poll;
		await carbonVoteXInstance.register(startBlock, endBlock, EXISTNG_POLL_ID, TokenAddress, {from: REGISTER_ACCOUNT});
		const poll = await carbonVoteXInstance.getPoll(EXISTNG_POLL_ID);
		assert.equal(startBlock, poll[0].toString(10), "Register startBlock failed");
		assert.equal(endBlock, poll[1].toString(10), "Register endBlock failed");
		assert.equal(parseInt(EXISTNG_POLL_ID, 16), parseInt(poll[2], 16), "Register pollId failed");
		assert.equal(parseInt(TokenAddress), parseInt(poll[3], 16), "Register token address failed");
	});

	it("Test writeAvailableVotes", async () => {
		const choice = "11";
		const votingRight = "1000";

		// write available votes to a account
		await carbonVoteXInstance.writeAvailableVotes(EXISTNG_POLL_ID, MASTER_ACCOUNT, votingRight, {from: MASTER_ACCOUNT});
		const available = await carbonVoteXInstance.readAvailableVotes(EXISTNG_POLL_ID, MASTER_ACCOUNT);
		// assert the account has received voting right.
		assert.equal("1000", available.toString(10), "Incorrect voting right received by account")
	});

	it ("Test voting", async () => {
		const choice = "11";
		// the amount of votes
		const votes = "500";

		await carbonVoteXInstance.voteFor(EXISTNG_POLL_ID, MASTER_ACCOUNT, choice, votes, {from: VOTE_FOR_ACCOUNT});
		const remain = await carbonVoteXInstance.readAvailableVotes(EXISTNG_POLL_ID, MASTER_ACCOUNT);
		const result = await carbonVoteXInstance.getVotingResultByVoter(EXISTNG_POLL_ID, MASTER_ACCOUNT,choice);

		// check remaining available voting right.
		// execpt 1000 - 500 = 500.
		assert.equal("500", remain.toString(10), "Incorrect remaining voting right");
		assert.equal("500", result.toString(10), "Incorrect voting result");
	});

	it ("Test getVotingResult", async () => {
		const votedChoice = "11";
		const unvotedChoice = "22";

		// get voting result.
		const result = await carbonVoteXInstance.getVotingResult(EXISTNG_POLL_ID, votedChoice);
		const zeroResult = await carbonVoteXInstance.getVotingResult(EXISTNG_POLL_ID, unvotedChoice);
		assert ("500", result.toString(10), "Incorrect voting result");
		assert ("0", zeroResult.toString(10), "Incorrect voting result");
	});

	describe ("testing DSAuth:", () => {
		it ("only MASTER_ACCOUNT can call writeAvailableVotes",
			async () =>{
				const availableVotes = 1500;
				await carbonVoteXInstance.writeAvailableVotes(
					EXISTNG_POLL_ID, 
					UNAUTHORIZED_ACCOUNT,
					availableVotes,
					{from: MASTER_ACCOUNT}
				)

				await carbonVoteXInstance.writeAvailableVotes(
					EXISTNG_POLL_ID, 
					UNAUTHORIZED_ACCOUNT,
					availableVotes, 
					{from: REGISTER_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.writeAvailableVotes(
					EXISTNG_POLL_ID, 
					UNAUTHORIZED_ACCOUNT,
					availableVotes, 
					{from: VOTE_FOR_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.writeAvailableVotes(
					EXISTNG_POLL_ID, 
					UNAUTHORIZED_ACCOUNT,
					availableVotes, 
					{from: SEND_GAS_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.writeAvailableVotes(
					EXISTNG_POLL_ID, 
					UNAUTHORIZED_ACCOUNT,
					availableVotes, 
					{from: UNAUTHORIZED_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);
		});

		// REGISTER_ACCOUNT
		it ("only REGISTER_ACCOUNT can call restricted function register",
			async () =>{
				const EXISTNG_POLL_ID2 = "0x0000000000000000000000000000000000000000000000000000000000000002";
				const startBlock = "50000";
				const endBlock = "30000000";
				await carbonVoteXInstance.register(
					startBlock, 
					endBlock, 
					EXISTNG_POLL_ID2, 
					TokenAddress, 
					{from: REGISTER_ACCOUNT});

				await carbonVoteXInstance.register(
					startBlock, 
					endBlock, 
					EXISTNG_POLL_ID2, 
					TokenAddress, 
					{from: MASTER_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.register(
					startBlock, 
					endBlock, 
					EXISTNG_POLL_ID2, 
					TokenAddress, 
					{from: VOTE_FOR_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.register(
					startBlock, 
					endBlock, 
					EXISTNG_POLL_ID2, 
					TokenAddress, 
					{from: SEND_GAS_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.register(
					startBlock, 
					endBlock, 
					EXISTNG_POLL_ID2, 
					TokenAddress, 
					{from: UNAUTHORIZED_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);
		});

		// account[3];
		it ("VOTE_FOR_ACCOUNT can call restricted function voteFor",
			async () =>{
				const choice = "11";
				const votes = "500";
				await carbonVoteXInstance.voteFor(
					EXISTNG_POLL_ID, 
					MASTER_ACCOUNT, 
					choice, 
					votes, 
					{from: VOTE_FOR_ACCOUNT}
				);

				await carbonVoteXInstance.voteFor(
					EXISTNG_POLL_ID, 
					MASTER_ACCOUNT, 
					choice, 
					votes, 
					{from: MASTER_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.voteFor(
					EXISTNG_POLL_ID, 
					MASTER_ACCOUNT, 
					choice, 
					votes, 
					{from: REGISTER_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.voteFor(
					EXISTNG_POLL_ID, 
					MASTER_ACCOUNT, 
					choice, 
					votes, 
					{from: SEND_GAS_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.voteFor(
					EXISTNG_POLL_ID, 
					MASTER_ACCOUNT, 
					choice, 
					votes, 
					{from: UNAUTHORIZED_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);
		});

		it ("account[4] can call restricted function sendGas",
			async () => {
				await carbonVoteXInstance.sendGas(EXISTNG_POLL_ID, {from: SEND_GAS_ACCOUNT});

				await carbonVoteXInstance.sendGas(
					EXISTNG_POLL_ID, 
					{from: MASTER_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.sendGas(
					EXISTNG_POLL_ID, 
					{from: REGISTER_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.sendGas(EXISTNG_POLL_ID, 
					{from: VOTE_FOR_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);

				await carbonVoteXInstance.sendGas(
					EXISTNG_POLL_ID, 
					{from: UNAUTHORIZED_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);
		});

		//TODO: add more unit tests for DSAuth.
	});

	describe("operations to non-exist poll", () => {
		it ("should fail when sendGas", async () => {
			await carbonVoteXInstance.sendGas("0xa").should.be.rejectedWith(EVMRevert);
		});

		// TODO:
		// it("should fail when getGasSent (not )", async () => {
		// 	const result = await carbonVoteXInstance.getGasSent("0xa1", MASTER_ACCOUNT);
		// 	console.log("returned :", result.toString(10));
		// });

		// TODO: more tests 
	}); 
})
