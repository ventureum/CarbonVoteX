pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract CarbonVoteX {

    // events that are emitted after changes.
    event _Register(
        address indexed msgSender,
        bytes32 pollId,
        uint startBlock,
        uint endBlock,
        address tokenAddr
    );
    event _WriteAvailableVotes (
        address indexed msgSender,
        bytes32 pollId, 
        address voter, 
        uint votes
    );
    event _Vote(address indexed msgSender, bytes32 pollId,bytes32 choice, uint votes);
    event _SendGas(address indexed msgSender, bytes32 pollId);
    
    struct Poll {
        // voter address => choice => votes
        // choice can be hashed value of voting options
        // e.g. sha3("choice #1"), sha3("choice #2")
        mapping (address => mapping(bytes32 => uint)) votes;
        // choice => votes
        mapping (bytes32 => uint) totalVotesByChoice;
        // voter address => available votes;
        mapping (address => uint) availableVotes;
        // map voter's address to the amount of gas sent
        mapping (address => uint) gasSentByVoter;
        uint startBlock;
        uint endBlock;
        bytes32 pollId;
        // the ERC20 token used
        ERC20 token;
    }

    // pollId => Poll struct
    mapping (bytes32 => Poll) public polls;

    // master's address
    address private master;

    // apply SafeMath to uint
    using SafeMath for uint;

    /*
     * Modifiers
     */
    modifier isMaster(){
        require (msg.sender == master);
        _;
    }

    /*
     * Constructor
     */
    // @param master address which is able to write votes
    // the master address is owned by a backend server
    constructor (address _master) public{
        master = _master;
    }

    // @param pollId UUID (hash value) of a poll
    // returns the startBlock, endBlock, pollId and token address of the poll.
    function getPoll (bytes32 _pollId) public view returns (uint, uint, bytes32, address) {
        //Check if poll exists
        require(pollExist(_pollId));

        Poll storage poll = polls[_pollId];
        return (poll.startBlock, poll.endBlock, poll.pollId, poll.token);
    }

    // @param pollId UUID (hash value) of a poll
    // @param voter the address of the voter
    // returns the amount of gas remining for voter
    function getGasSent(bytes32 pollId, address voter) public view returns (uint) {
        //Check if poll exists
        require(pollExist(pollId));

        return polls[pollId].gasSentByVoter[voter];
    }

    // @param pollId UUID (hash value) of a poll
    // store the amount of gas sent by the voter 
    function sendGas(bytes32 pollId) public payable {
        // poll must exit and has not yet expired. 
        require (pollExist(pollId) && !pollExpired(pollId));

        polls[pollId].gasSentByVoter[msg.sender] += msg.value;
        emit _SendGas(msg.sender, pollId);
    }

    // @param startBlock starting block (unix timestamp) of the event
    // @param endBlock ending block (unix timestamp) of the event
    // @param pollId UUID (hash value) of a poll
    // @param tokenAddr the address of the token
    // register a new poll
    // Note that we do not allow re-registrations for the same UUID
    function register(uint startBlock, uint endBlock, bytes32 pollId, address tokenAddr) public {
        // Check if poll exists.
        require (!pollExist(pollId));
        // check resonable endBlock and startBlock
        require (startBlock > block.number && startBlock < endBlock);

        // Create a new poll and map the poll hashed value to the poll.
        Poll memory poll = Poll({ 
            startBlock: startBlock,
            endBlock: endBlock,
            pollId: pollId,
            token: ERC20(tokenAddr)});
        polls[pollId] = poll;
        emit _Register(msg.sender, pollId, startBlock, endBlock, tokenAddr);
    }

    // @param pollId UUID (hash value) of a poll
    // @param voter address of a voter    
    // @param votes number of votes to write
    // can only be called by the master address
    function writeAvailableVotes(bytes32 pollId, address voter, uint votes) public isMaster {
        // poll must exit and has not yet expired. 
        require (pollExist(pollId) && !pollExpired(pollId));

        polls[pollId].availableVotes[voter] = polls[pollId].availableVotes[voter].add(votes); 
        emit _WriteAvailableVotes(msg.sender, pollId, voter, votes);
    }

    // @param pollId UUID (hash value) of a poll
    // @param voter address of a voter
    // returns the number of available votes
    function readAvailableVotes(bytes32 pollId, address voter) public view returns (uint) {
        require (pollExist(pollId));

        return polls[pollId].availableVotes[voter];
    }

    // @param pollId UUID (hash value) of a poll
    // @param choice the choice of votes
    // @param votes number of votes to redeem for choice
    // After the poll finishes, and have already called registerVotes()
    // vote for "choice"
    // deduct the total number of votes available by votes
    function vote(bytes32 pollId, bytes32 choice, uint votes) public {
        // poll must exits and not yet expired. 
        require (pollExist(pollId) && !pollExpired(pollId));
        
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
        emit _Vote(msg.sender, pollId, choice, votes);
    }

    // @param pollId UUID (hash value) of a poll
    // @param choice the choice of the poll
    // returns the number of votes for choice "choice" in poll "pollId"
    // typically called by other contracts
    function getVotingResult(bytes32 pollId, bytes32 choice) public view returns (uint) {
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
    public
    view 
    returns (uint) {
        //Check if poll exists
        require(pollExist(pollId));

        return polls[pollId].votes[voter][choice];
    }

    // @param pollId of the poll.
    // returns whethere the poll exists;
    function pollExist(bytes32 pollId) public view returns(bool) {
        return polls[pollId].pollId > 0 ;
    }

    // @param pollId of the poll.
    // returns whethere the poll has expired
    function pollExpired(bytes32 pollId) public view returns (bool) {
        // Check if poll exists
        require(pollExist(pollId));

        return block.number >= polls[pollId].endBlock;
    }
}
