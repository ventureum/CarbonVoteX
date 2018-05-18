pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./ICarbonVoteXReceiver.sol";
import "./guard.sol";


contract CarbonVoteXCore is DSGuard {

    // events that are emitted after changes.
    event _Register(
        address indexed msgSender,
        bytes32 namespace,
        bytes32 pollId,
        uint startBlock,
        uint endBlock,
        address tokenAddr
    );
    event _WriteAvailableVotes (
        address indexed msgSender,
        bytes32 namespace,
        bytes32 pollId, 
        address voter, 
        uint votes
    );
    event _SendGas(address indexed msgSender, bytes32 namespace, bytes32 pollId);
    
    struct Poll {
        // map if a voter has already obtained voting right
        mapping (address => bool) obtained;
        // map voter's address to the amount of gas sent
        mapping (address => uint) gasSentByVoter;
        uint startBlock;
        uint endBlock;
        bytes32 pollId;
        // the ERC20 token used
        ERC20 token;
    }

    // namespace => pollId => Poll struct
    mapping(bytes32 => mapping (bytes32 => Poll)) public polls;

    // namespace => receiver addresses
    mapping(bytes32 => address) receiverAddr;

    // master's address
    address private master;

    // map the hashed function name to the signature of the function
    mapping(bytes32 => bytes4) public functionSig;

    // apply SafeMath to uint
    using SafeMath for uint;

    /*
     * Constructor
     */
    // @param master address which is able to write votes,
    // the master address is owned by a backend server
    constructor (address _master) public {
        // initiate functionSig mapping;
        functionSig[keccak256("register")] = this.register.selector;
        functionSig[keccak256("writeAvailableVotes")] = this.writeAvailableVotes.selector;
        functionSig[keccak256("sendGas")] = this.sendGas.selector;
        setAuthority(this);
        master = _master;
        // permit(msg.sender, this, this.setReceiver.selector);
        // permit(msg.sender, this, this.setPermissions.selector);
        permit(master, this, this.writeAvailableVotes.selector);
    }

    // @param restrictedFunctions a list of the signature restricted functions
    // @param authorizedAddr a list of authorized address
    // grant permission to given addresses
    function setPermissions(bytes32[] restrictedFunctions, address[] authorizedAddr) public auth {
        for (uint i = 0; i < restrictedFunctions.length; i++){
            // user cannot permit functions that are not auth.
            // user cannot permit writeAvailableVotes
            if (functionSig[restrictedFunctions[i]] != 0 && 
                restrictedFunctions[i] != keccak256("writeAvailableVotes")
                ){
                permit(authorizedAddr[i], this, functionSig[restrictedFunctions[i]]);
            }
            else {
                revert();
            }
        }
    }

    // @param namespace the namespace of CarbonVoteX receiver
    // @param receiver the address of CarbonVoteX receiver
    // map namespace to receiver address
    function setReceiver(bytes32 namespace, address receiver) public auth {
        receiverAddr[namespace] = receiver;
    }

    // @param namespace the namespace of CarbonVoteX receiver
    // @param startBlock starting block (unix timestamp) of the event
    // @param endBlock ending block (unix timestamp) of the event
    // @param pollId UUID (hash value) of a poll
    // @param tokenAddr the address of the token
    // a restricted function
    // register a new poll
    // Note that we do not allow re-registrations for the same UUID
    function register (
        bytes32 namespace,
        uint startBlock,
        uint endBlock,
        bytes32 pollId,
        address tokenAddr
    )
    public
    auth
    {
        // Check if poll exists.
        require (!pollExist(namespace, pollId));
        // check resonable endBlock and startBlock
        require (startBlock < endBlock);

        // Create a new poll and map the poll hashed value to the poll.
        Poll memory poll = Poll({ 
            startBlock: startBlock,
            endBlock: endBlock,
            pollId: pollId,
            token: ERC20(tokenAddr)
        });
        polls[namespace][pollId] = poll;

        emit _Register(msg.sender, namespace, pollId, startBlock, endBlock, tokenAddr);
    }

    // @param namespace the namespace of CarbonVoteX receiver
    // @param pollId UUID (hash value) of a poll
    // returns the startBlock, endBlock, pollId and token address of the poll.
    function getPoll (
        bytes32 namespace, 
        bytes32 _pollId
    ) 
    public 
    view 
    returns (uint, uint, bytes32, address) 
    {
        //Check if poll exists
        require(pollExist(namespace, _pollId));

        Poll storage poll = polls[namespace][_pollId];
        return (poll.startBlock, poll.endBlock, poll.pollId, poll.token);
    }

    // @param namespace the namespace of CarbonVoteX receiver
    // @param pollId UUID (hash value) of a poll
    // @param voter the address of the voter
    // returns the amount of gas remining for voter
    function getGasSent(
        bytes32 namespace, 
        bytes32 pollId, 
        address voter
    ) 
    public 
    view 
    returns (uint) 
    {
        //Check if poll exists
        require(pollExist(namespace, pollId));

        return polls[namespace][pollId].gasSentByVoter[voter];
    }

    // @param namespace the namespace of CarbonVoteX receiver
    // @param pollId UUID (hash value) of a poll
    // a restricted function
    // store the amount of gas sent by the voter 
    function sendGas(bytes32 namespace, bytes32 pollId) public payable auth {
        // poll must exit and has not yet expired. 
        require (pollExist(namespace, pollId) && !pollExpired(namespace, pollId));

        polls[namespace][pollId].gasSentByVoter[msg.sender] += msg.value;

        emit _SendGas(msg.sender, namespace, pollId);
    }

    // @param namespace the namespace of CarbonVoteX receiver 
    // @param pollId UUID (hash value) of a poll
    // @param voter address of a voter    
    // @param votes number of votes to write
    // a restricted function
    // can only be called by the master address
    function writeAvailableVotes(
        bytes32 namespace, 
        bytes32 pollId, 
        address voter, 
        uint votes
    ) 
    public
    auth 
    {
        // poll must exit and has not yet expired. 
        require (pollExist(namespace, pollId) && !pollExpired(namespace, pollId));
        // a voter must not get vote twice.
        require (!voteObtained(namespace, pollId, voter));

        polls[namespace][pollId].obtained[voter] = true;

        if (receiverAddr[namespace] != address(0x0)) {
            ICarbonVoteXReceiver receiver = ICarbonVoteXReceiver(receiverAddr[namespace]);
            receiver.writeAvailableVotes(pollId, voter, votes);
        }
        else {
            // namespace does not exist
            revert ();
        }

        emit _WriteAvailableVotes(msg.sender, namespace, pollId, voter, votes);
    }

    // @param namespace the namespace of CarbonVoteX receiver 
    // @param pollId of the poll
    // returns whethere the poll exists
    function pollExist(bytes32 namespace, bytes32 pollId) public view returns(bool) {
        return polls[namespace][pollId].pollId > 0 ;
    }

    // @param namespace the namespace of CarbonVoteX receiver 
    // @param pollId of the poll
    // returns whethere the poll has expired
    function pollExpired(bytes32 namespace, bytes32 pollId) public view returns (bool) {
        // Check if poll exists
        require(pollExist(namespace, pollId));

        return block.number >= polls[namespace][pollId].endBlock;
    }
    
    // @param namespace the namespace of CarbonVoteX receiver 
    // @param pollId UUID (hash value) of a poll
    // @param voter address of a voter
    // returns whether a voter has already obtained votes.
    function voteObtained(
        bytes32 namespace, 
        bytes32 pollId, 
        address voter
    ) 
    public 
    view 
    returns (bool) 
    {
        return polls[namespace][pollId].obtained[voter];
    }
}
