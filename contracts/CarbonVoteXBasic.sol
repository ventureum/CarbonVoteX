pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./guard.sol";
import "./ICarbonVoteXReceiver.sol";
import "./CarbonVoteXCore.sol";


contract CarbonVoteXBasic is ICarbonVoteXReceiver{

    // event _Vote(address indexed msgSender, bytes32 pollId,bytes32 choice, uint votes);
    event _Vote(
        address indexed msgSender, 
        bytes32 namespace, 
        bytes32 pollId,
        bytes32 choice, 
        uint votes
    );
    // apply SafeMath to uint
    using SafeMath for uint;

    struct Poll {
        // voter address => choice => votes
        // choice can be hashed value of voting options
        // e.g. sha3("choice #1"), sha3("choice #2")
        mapping (address => mapping(bytes32 => uint)) votes;
        // choice => votes
        mapping (bytes32 => uint) totalVotesByChoice;
        // voter address => available votes;
        mapping (address => uint) availableVotes;
    }

    // pollId => Poll struct
    mapping (bytes32 => Poll) polls;
    CarbonVoteXCore public core;
    bytes32 public namespace;

    /*
     * Constructor
     */
    // @param master address which is able to write votes,
    // the master address is owned by a backend server
    constructor (bytes32 _namespace, address coreAddr) public {
        namespace = _namespace;
        core = CarbonVoteXCore(coreAddr);
        // core.setReceiver(namespace, this);

        // permit core to call writeAvailableVotes() of this contract
        // permit(coreAddr, this, this.writeAvailableVotes.selector);
    }

    // @param startBlock starting block (unix timestamp) of the event
    // @param endBlock ending block (unix timestamp) of the event
    // @param pollId UUID (hash value) of a poll
    // @param tokenAddr the address of the token
    // a restricted function
    // start a new poll
    // Note that we do not allow re-registrations for the same UUID
    function startPoll(
        uint startBlock, 
        uint endBlock, 
        bytes32 pollId, 
        address tokenAddr
    ) 
    public 
    {
        core.register(namespace, startBlock, endBlock, pollId, tokenAddr);
    }

    // @param pollId UUID (hash value) of a poll
    // returns the startBlock, endBlock, pollId and token address of the poll.
    function getPoll (bytes32 pollId) external view returns (uint, uint, bytes32, address) {
        return core.getPoll(namespace, pollId);
    }

    // @param pollId UUID (hash value) of a poll
    // @param voter the address of the voter
    // returns the amount of gas remining for voter
    function getGasSent(bytes32 pollId, address voter) external view returns (uint) {
        return core.getGasSent(namespace, pollId, voter);
    }

    // @param pollId UUID (hash value) of a poll
    // @param voter address of a voter
    // returns the number of available votes
    function readAvailableVotes(bytes32 pollId, address voter) external view returns (uint) {
        require(pollExist(pollId));
        return polls[pollId].availableVotes[voter];
    }

    // @param pollId UUID (hash value) of a poll
    // @param choice the choice of votes
    // @param votes number of votes to redeem for choice
    // Users can vote with choice "choice" in poll "pollId" with the amount of "votes"
    function vote(bytes32 pollId, bytes32 choice, uint votes) external {
        // poll must exits and not yet expired. 
        require(pollExist(pollId) && !pollExpired(pollId));
        
        // voter cannot vote more votes than it has.
        require (polls[pollId].availableVotes[msg.sender].sub(votes) >= 0);
        // deduct voter's available votes from.
        polls[pollId].availableVotes[msg.sender] = 
            polls[pollId].availableVotes[msg.sender].sub(votes);
        // place votes to voter's choice. 
        polls[pollId].votes[msg.sender][choice] = 
            polls[pollId].votes[msg.sender][choice].add(votes);
        // place votes to totalVotesByChoice;
        polls[pollId].totalVotesByChoice[choice] = 
            polls[pollId].totalVotesByChoice[choice].add(votes);

        emit _Vote(msg.sender, namespace, pollId, choice, votes);
    }

    // @param pollId UUID (hash value) of a poll
    // @param choice the choice of the poll
    // returns the number of votes for choice "choice" in poll "pollId"
    // typically called by other contracts
    function getVotingResult(bytes32 pollId, bytes32 choice) external view returns (uint) {
        //Check if poll exists
        require(pollExist(pollId));

        return polls[pollId].totalVotesByChoice[choice];
    }

    // @param pollId UUID (hash value) of a poll
    // @param voter address of a voter
    // @param choice the choice of the poll
    // returns the number of votes for choice "choice" by "voter" in poll "pollId"
    // typically called by other contracts
    function getVotingResultByVoter(bytes32 pollId, address voter, bytes32 choice) 
    external
    view 
    returns (uint) 
    {
        //Check if poll exists
        require(pollExist(pollId));

        return polls[pollId].votes[voter][choice];
    }

    // @param pollId of the poll
    // returns whethere the poll exists
    function pollExist(bytes32 pollId) public view returns(bool) {
        return core.pollExist(namespace, pollId);
    }

    // @param pollId of the poll
    // returns whethere the poll has expired
    function pollExpired(bytes32 pollId) public view returns (bool) {
        // Check if poll exists
        require(pollExist(pollId));

        return core.pollExpired(namespace, pollId);
    }
    
    // @param pollId UUID (hash value) of a poll
    // @param voter address of a voter
    // returns whether a voter has already obtained votes.
    function voteObtained(bytes32 pollId, address voter) external view returns (bool) {
        return core.voteObtained(namespace, pollId, voter);
    }

    /**
        returns the namespace of this CarbonVoteReceiver.
    */
    function getNamespace() external view returns (bytes32){
        return namespace;
    }

    /**
        Interface function
        @param pollId UUID (hash value) of a poll
        @param voter address of a voter    
        @param votes number of votes to write
        a restricted function
        can only be called by the master address
    */
    function writeAvailableVotes(bytes32 pollId, address voter, uint votes) external {
        require (msg.sender == address(core));
        polls[pollId].availableVotes[voter] = votes;
    }


}
