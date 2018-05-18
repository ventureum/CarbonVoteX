import EVMRevert from 'openzeppelin-solidity/test/helpers/EVMRevert';

const CarbonVoteXCore = artifacts.require("./CarbonVoteXCore");
const CarbonVoteXBasic = artifacts.require("./CarbonVoteXBasic");
const TokenAddress = "0x337cDDa6D41A327c5ad456166CCB781a9722AFf9";
var Web3 = require ('web3');
const wweb3 = new Web3();
var BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Test_CarbonVote', (accounts) => {
	let carbonVoteXInstance;
	const EXISTNG_POLL_ID = "0x0000000000000000000000000000000000000000000000000000000000000001";
	// accounts setting in this test environment:
	// accounts[0] has root power, it can do anything. 
	// accounts[1] is master account, it can call writeAvailableVote
	// accounts[2] is unauthorized account (will be authorized) .
	// accounts[3] is unauthorized account.
	const ROOT_ACCOUNT = accounts[0];
	const MASTER_ACCOUNT = accounts[1];
	const UNAUTHORIZED_ACCOUNT1 = accounts[2]
	const UNAUTHORIZED_ACCOUNT2 = accounts[3];
	var core, basic, namespaceBasic;

  	before(async ()=>{
		core = await CarbonVoteXCore.deployed();
		basic = await CarbonVoteXBasic.deployed();
		namespaceBasic = await basic.getNamespace();
  		await core.setPermissions([wweb3.utils.sha3("register")], [basic.address]);
  		await core.setReceiver(namespaceBasic, basic.address);
	});

  	describe("basic testings: ", () => {
		it("Test register and getPoll", async () => {
			const startBlock = "50000";
			const endBlock = "30000000";
			// Regiter a new poll;
			await basic.startPoll(startBlock, endBlock, EXISTNG_POLL_ID, TokenAddress);
			const poll = await basic.getPoll(EXISTNG_POLL_ID);
			assert.equal(startBlock, poll[0].toString(10), "Register startBlock failed");
			assert.equal(endBlock, poll[1].toString(10), "Register endBlock failed");
			assert.equal(parseInt(EXISTNG_POLL_ID, 16), parseInt(poll[2], 16), "Register pollId failed");
			assert.equal(parseInt(TokenAddress), parseInt(poll[3], 16), "Register token address failed");
		});

		it("Test writeAvailableVotes", async () => {
			const choice = "11";
			const votingRight = "1000";

			// write available votes to a account
			await core.writeAvailableVotes(namespaceBasic, EXISTNG_POLL_ID, MASTER_ACCOUNT, votingRight, {from: MASTER_ACCOUNT});
			const available = await basic.readAvailableVotes(EXISTNG_POLL_ID, MASTER_ACCOUNT);
			// assert the account has received voting right.
			assert.equal("1000", available.toString(10), "Incorrect voting right received by account")
		});

		it ("Test voting", async () => {
			const choice = "11";
			// the amount of votes
			const votes = "500";

			await basic.vote(EXISTNG_POLL_ID, choice, votes, {from: MASTER_ACCOUNT});
			const remain = await basic.readAvailableVotes(EXISTNG_POLL_ID, MASTER_ACCOUNT);
			const result = await basic.getVotingResultByVoter(EXISTNG_POLL_ID, MASTER_ACCOUNT,choice);

			// check remaining available voting right.
			// execpt 1000 - 500 = 500.
			assert.equal("500", remain.toString(10), "Incorrect remaining voting right");
			assert.equal("500", result.toString(10), "Incorrect voting result");
		});

		it ("Test getVotingResult", async () => {
			const votedChoice = "11";
			const unvotedChoice = "22";

			// get voting result.
			const result = await basic.getVotingResult(EXISTNG_POLL_ID, votedChoice);
			const zeroResult = await basic.getVotingResult(EXISTNG_POLL_ID, unvotedChoice);
			assert ("500", result.toString(10), "Incorrect voting result");
			assert ("0", zeroResult.toString(10), "Incorrect voting result");
		});
	});

	describe ("testing DSAuth:", () => {
		it ("only MASTER_ACCOUNT can call writeAvailableVotes",
			async () =>{
				const availableVotes = 1500;
				await core.writeAvailableVotes(
					namespaceBasic,
					EXISTNG_POLL_ID, 
					UNAUTHORIZED_ACCOUNT1,
					availableVotes,
					{from: MASTER_ACCOUNT}
				)

				await core.writeAvailableVotes(
					namespaceBasic,
					EXISTNG_POLL_ID, 
					UNAUTHORIZED_ACCOUNT1,
					availableVotes, 
					{from: UNAUTHORIZED_ACCOUNT1}
				).should.be.rejectedWith(EVMRevert);
		});

		it ("writeAvailableVotes in a receiver can only be call by Core",
			async () => {
				const availableVotes = 1500;
				await basic.writeAvailableVotes(
					EXISTNG_POLL_ID, 
					UNAUTHORIZED_ACCOUNT1,
					availableVotes, 
					{from: MASTER_ACCOUNT}
					).should.be.rejectedWith(EVMRevert);
		});

		// REGISTER_ACCOUNT
		it ("only receiver can register a new poll",
			async () =>{
				const newPollId = "0x0000000000000000000000000000000000000000000000000000000000000002";
				const startBlock = "50000";
				const endBlock = "30000000";
				const unknowNameSpace = "unknow";
				await basic.startPoll(
					startBlock, 
					endBlock, 
					newPollId, 
					TokenAddress, 
					{from: MASTER_ACCOUNT});

				await core.register(
					unknowNameSpace,
					startBlock, 
					endBlock, 
					newPollId, 
					TokenAddress, 
					{from: MASTER_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);
		});

		it ("only ROOT_ACCOUNT can setPermissions", 
			async () =>{
				await core.setPermissions (
					[wweb3.utils.sha3("sendGas")], 
					[UNAUTHORIZED_ACCOUNT1]
				);

				await core.setPermissions (
					[wweb3.utils.sha3("register")], 
					[UNAUTHORIZED_ACCOUNT1],
					{from: MASTER_ACCOUNT}
				).should.be.rejectedWith(EVMRevert);
		});
		
		it ("UNAUTHORIZED_ACCOUNT1 now can call sendGas after setPermission",
			async () => {
				await core.sendGas(
					namespaceBasic, 
					EXISTNG_POLL_ID, 
					{from: UNAUTHORIZED_ACCOUNT1}
				);
		});
	});

	describe("operations to non-exist poll", () => {
		it ("should fail when sendGas", async () => {
			await core.sendGas(namespaceBasic,"0xa").should.be.rejectedWith(EVMRevert);
		});

		// TODO:
		// it("should fail when getGasSent (not )", async () => {
		// 	const result = await carbonVoteXInstance.getGasSent("0xa1", MASTER_ACCOUNT);
		// 	console.log("returned :", result.toString(10));
		// });

		// TODO: more tests 
	});
});
