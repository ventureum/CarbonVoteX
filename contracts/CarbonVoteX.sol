pragma solidity ^0.4.23;

import "./EIP20Token.sol";

contract CarbonVoteX {
    struct Poll {
        // voter address => choice => votes
        // choice can be hashed value of voting options
        // e.g. sha3("choice #1"), sha3("choice #2")
        mapping (address => mapping(bytes32 => uint)) voterVotes;
        // choice => votes
        mapping (bytes32 => uint) choiceVotes;
        // voter address => available votes;
        mapping (address => uint) availableVotes;
        //map voter's address to the amount of gas sent
        mapping (address => uint) gasSentByVoter;
        uint startBlock;
        uint endBlock;
        bytes32 pollId;
        // the ERC20 token used
        EIP20Token token;
    }

    // associative container of staking events
    // _pollId => PollInfo
    mapping (bytes32 => Poll) public polls;

    // master's address
    address private master;

    /*
     * Modifiers
     */
    modifier isMaster(){
        require (msg.sender == master);
        _;
    }

    // @param _pollId the id of poll
    // returns the startBlock, endBlock, pollId token address of the poll.
    function getPoll (bytes32 _pollId) public view returns (uint _startBlock, uint _endBlock, bytes32 _rpollId, address _tokenAddr){
        Poll storage poll = polls[_pollId];
        return (poll.startBlock, poll.endBlock, poll.pollId, poll.token);
    }

    // @param _master address which is able to write votes
    // the master address is owned by a backend server
    constructor (address _master) public{
        master = _master;
    }

    // @param _voter the address of the voter
    // returns the amount of gas remining for _voter
    function getGasSent(bytes32 _pollId, address _voter) public view returns (uint){
        return polls[_pollId].gasSentByVoter[_voter];
    }

    // store the amount of gas sent by the voter 
    function sendGas(bytes32 _pollId) public payable {
        polls[_pollId].gasSentByVoter[msg.sender] += msg.value;
    }

    // @param _pollId UUID (hash value) of a poll
    // @param _startBlock starting block (unix timestamp) of the event
    // @param _endBlock ending block (unix timestamp) of the event
    // register a new poll
    // Note that we do not allow re-registrations for the same UUID
    function register(bytes32 _pollId, uint _startBlock, uint _endBlock, address _tokenAddr) public {
        //Check if poll exists.
        require (pollExist(_pollId) == false, "Poll already exist");
        // check resonable endBlock and startBlock
        require (_endBlock > block.number && _startBlock < _endBlock, "invalid blckTime");
        //Create a new poll and map the poll hashed value to the poll.
        Poll memory poll = Poll({ startBlock: _startBlock,
                                endBlock: _endBlock,
                                pollId: _pollId,
                                token: EIP20Token(_tokenAddr)});
        polls[_pollId] =poll;
    }

    // @param pollId pollId (hash value) of a poll
    // @param voter address of a voter    
    // @param votes number of votes to write
    // can only be called by the master address
    function writeAvailableVotes(bytes32 _pollId, address _voter, uint _votes) public isMaster {
        require (pollExist(_pollId));

        polls[_pollId].availableVotes[_voter] += _votes; 
    }

    // @param pollId pollId (hash value) of a poll
    // @param voter address of a voter
    // returns the number of available votes
    function readAvailableVotes(bytes32 _pollId, address _voter) view public returns (uint){
        require (pollExist(_pollId));

        return polls[_pollId].availableVotes[_voter];
    }

    // @param _pollId UUID (hash value) of a poll
    // @param _voteMeta vote meta data
    // @param _votes number of votes to redeem for voteMeta
    // After the poll finishes, and have already called registerVotes()
    // vote for "choice"
    // deduct the total number of votes available by votes
    function vote(bytes32 _pollId, bytes32 _choice, uint _votes) public{
        // poll must exits and not yet expired. 

        require (pollExist(_pollId) && !pollExpired(_pollId));
        
        // voter cannot vote more votes than it has.
        assert (polls[_pollId].availableVotes[msg.sender] - _votes >= 0);
        // deduct voter's available votes from.
        polls[_pollId].availableVotes[msg.sender] -= _votes;
        // place votes to voter's choice. 
        polls[_pollId].voterVotes[msg.sender][_choice] += _votes;
        // place votes to choiceVotes;
        polls[_pollId].choiceVotes[_choice] += _votes;
    }

    // @param _pollId pollId (hash value) of a
    // @param _choice the choice of the poll
    // returns the number of votes for choice "choice" in poll "pollId"
    // typically called by other contracts
    function getVotingResult(bytes32 _pollId, bytes32 _choice) view public returns (uint) {
        return polls[_pollId].choiceVotes[_choice];
    }
    // @param pollId pollId (hash value) of a
    // @param voter address of a voter
    // @param choice the choice of the poll
    // returns the number of votes for choice "choice" by "voter" in poll "pollId"
    // typically called by other contracts
    function getVotingResultByVoter(bytes32 _pollId, address _voter, bytes32 _choice) view public returns (uint) {
        return polls[_pollId].voterVotes[_voter][_choice];
    }
    // @param _pollId of the poll.
    // returns whethere the poll exists;
    function pollExist(bytes32 _pollId) view public returns(bool) {
        return polls[_pollId].pollId > 0 ;
    }

    // @param _pollId of the poll.
    // returns whethere the poll has expired
    function pollExpired(bytes32 _pollId) view public returns (bool){
        return block.number >= polls[_pollId].endBlock;
    }

}