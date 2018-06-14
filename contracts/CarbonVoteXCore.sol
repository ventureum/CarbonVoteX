pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./ICarbonVoteXReceiver.sol";
import "./guard.sol";


contract CarbonVoteXCore is DSGuard {
    // apply SafeMath to uint
    using SafeMath for uint;

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
    event _SendGas(
        address indexed msgSender, 
        bytes32 namespace, 
        bytes32 pollId,
        uint value
    );
    event _SetReceiver(
        bytes32 namespace,
        address receiverAddr
    );
    event _CancelReceiver(
        bytes32 namespace,
        address receiverAddr
    );

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

    // master's address
    address private master;

    // namespace => (pollId => Poll struct)
    mapping(bytes32 => mapping (bytes32 => Poll)) public polls;

    // namespace => receiver addresses
    mapping(bytes32 => address) public receiverAddr;

    // map the hashed function name to the signature of the function
    mapping(bytes32 => bytes4) public restrictedFunctionSig;

    // an array of available permissions
    bytes32[] public availablePermissions;

    bytes constant REGISTER = "register";
    bytes constant SEND_GAS = "sendGas";
    /*
     * Constructor
     * @param master the address, which is able to write votes,
     * the master address is owned by a backend server
     */
    constructor (address _master) public {
        // initiate restrictedFunctionSig mapping;
        initFunctionSig();
        setAuthority(this);
        master = _master;
        permit(master, this, this.writeAvailableVotes.selector);
    }

    // @param restrictedFunctions a list of hashed restricted function names
    // @param authorizedAddr the addresses to be authorized
    // grant permission to given addresses
    function setPermissions(bytes32[] restrictedFunctions, address[] authorizedAddr) public auth {
        require (restrictedFunctions.length == authorizedAddr.length);

        for (uint i = 0; i < restrictedFunctions.length; i++){
            // user cannot permit functions that are not restricted.
            if (restrictedFunctionSig[restrictedFunctions[i]] != 0){
                permit(authorizedAddr[i], this, restrictedFunctionSig[restrictedFunctions[i]]);
            }
            else {
                revert();
            }
        }
    }

    // @param restrictedFunctions a list of hashed restricted function names
    // @param authorizedAddr the address to be authorized
    // grant permission to the given address
    function setPermissions(bytes32[] restrictedFunctions, address authorizedAddr) public auth {
        for (uint i = 0; i < restrictedFunctions.length; i++){
            // user cannot permit functions that are not restricted.
            if (restrictedFunctionSig[restrictedFunctions[i]] != 0){
                permit(authorizedAddr, this, restrictedFunctionSig[restrictedFunctions[i]]);
            }
            else {
                revert();
            }
        }
    }

    // @param authorizedAddr the authorized address 
    // This function revoke all permissions that authorizedAddr has
    function cancelPermissions(address authorizedAddr) public auth {
        for (uint i = 0; i < availablePermissions.length; i++){
            forbid(authorizedAddr, this, restrictedFunctionSig[availablePermissions[0]]);
        }
    }
    
    // @param restrictedFunctions a list of hashed restricted function names
    // @param authorizedAddr the authorized address
    // This function revokes access that authorizedAddr has to 
    // restricted functions listed in restrictedFunctions
    function cancelPermissions(
        bytes32[] restrictedFunctions,
        address authorizedAddr
    ) 
        public 
        auth 
    {
        for (uint i = 0; i < restrictedFunctions.length; i++){
            // user cannot cancel functions that are not restricted.
            if (restrictedFunctionSig[restrictedFunctions[i]] != 0)
            {
                forbid(authorizedAddr, this, restrictedFunctionSig[restrictedFunctions[i]]);
            }
            else {
                revert();
            }
        }
    }

    // @param restrictedFunctions a list of hashed restricted function names
    // @param authorizedAddr the authorized addresses
    // This function revokes access that authorizedAddr have to 
    // restricted functions listed in restrictedFunctions
    function cancelPermissions(
        bytes32[] restrictedFunctions, 
        address[] authorizedAddr
    ) 
        public 
        auth 
    {
        require (restrictedFunctions.length == authorizedAddr.length);

        for (uint i = 0; i < restrictedFunctions.length; i++){
            // user cannot cancel functions that are not restricted.
            if (restrictedFunctionSig[restrictedFunctions[i]] != 0){
                forbid(authorizedAddr[i], this, restrictedFunctionSig[restrictedFunctions[i]]);
            }
            else {
                revert();
            }
        }
    }

    // @param namespace the namespace of CarbonVoteX receiver
    // @param receiver the address of CarbonVoteX receiver
    // @param restrictedFunctions a list of hashed restricted function names 
    // Map namespace to receiver's address and
    // grant receiver permissions to the restricted functions
    // Note receiver is a deployed ICarbonVoteXReceiver
    function setReceiver(
        bytes32 namespace, 
        address _receiverAddr, 
        bytes32[] restrictedFunctions
    ) 
        public 
        auth 
    {
        // prevent accidentally overwrite other receivers.
        require(receiverAddr[namespace] == 0x0);

        receiverAddr[namespace] = _receiverAddr;
        setPermissions(restrictedFunctions, _receiverAddr);

        emit _SetReceiver(namespace, _receiverAddr);
    }

    // @param namespace the namespace of CarbonVoteX receiver
    // Remove receiver core and revoke all its permissions
    // This function can only be called by root account (contract creator)
    function cancelReceiver(bytes32 namespace) public auth {
        // saving gas by prevent meaningless tx
        require(receiverAddr[namespace] != 0x0);

        address _receiverAddr = receiverAddr[namespace];
        receiverAddr[namespace] = 0x0;

        cancelPermissions(_receiverAddr);

        emit _CancelReceiver(namespace, _receiverAddr);
    }


    // @param namespace the namespace of CarbonVoteX receiver
    // @param startBlock starting block (unix timestamp) of the event
    // @param endBlock ending block (unix timestamp) of the event
    // @param pollId UUID (hash value) of a poll
    // @param tokenAddr the address of the token
    // a restricted function
    // Register a new poll
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
    // @param voter address of a voter    
    // @param votes number of votes to write
    // a restricted function that can only be called by
    // the master address and contract creator
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
    // @param pollId UUID (hash value) of a poll
    // @return the startBlock, endBlock, pollId and token address of the poll.
    function getPoll (
        bytes32 namespace, 
        bytes32 _pollId
    ) 
        public 
        view 
        returns (uint, uint, bytes32, address) 
    {
        // Check if poll exists
        require(pollExist(namespace, _pollId));

        Poll storage poll = polls[namespace][_pollId];
        return (poll.startBlock, poll.endBlock, poll.pollId, poll.token);
    }

    // @param namespace the namespace of CarbonVoteX receiver
    // @param pollId UUID (hash value) of a poll
    // @param voter the address of the voter
    // @return the amount of gas remining for voter
    function getGasSent(
        bytes32 namespace, 
        bytes32 pollId, 
        address voter
    ) 
        public 
        view 
        returns (uint) 
    {
        // Check if poll exists
        require(pollExist(namespace, pollId));

        return polls[namespace][pollId].gasSentByVoter[voter];
    }

    // @param namespace the namespace of CarbonVoteX receiver 
    // @param pollId of the poll
    // @return whethere the poll exists
    function pollExist(bytes32 namespace, bytes32 pollId) public view returns(bool) {
        return polls[namespace][pollId].pollId > 0 ;
    }

    // @param namespace the namespace of CarbonVoteX receiver 
    // @param pollId of the poll
    // @return whethere the poll has expired
    function pollExpired(bytes32 namespace, bytes32 pollId) public view returns (bool) {
        // Check if poll exists
        require(pollExist(namespace, pollId));

        return block.number >= polls[namespace][pollId].endBlock;
    }
    
    // @param namespace the namespace of CarbonVoteX receiver 
    // @param pollId UUID (hash value) of a poll
    // @param voter address of a voter
    // @return whether a voter has already obtained votes.
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

    // @param namespace the namespace of CarbonVoteX receiver
    // @param pollId UUID (hash value) of a poll
    // a restricted function
    // store the amount of gas sent by the voter 
    function sendGas(bytes32 namespace, bytes32 pollId) public payable auth {
        // poll must exit and has not yet expired. 
        require (pollExist(namespace, pollId) && !pollExpired(namespace, pollId));

        polls[namespace][pollId].gasSentByVoter[msg.sender] += msg.value;

        emit _SendGas(msg.sender, namespace, pollId, msg.value);
    }

    // an internal function to initialize availablePermissions and restrictedFunctionSig
    function initFunctionSig() internal {
        availablePermissions.push(keccak256(REGISTER));
        availablePermissions.push(keccak256(SEND_GAS));
        restrictedFunctionSig[keccak256(REGISTER)] = this.register.selector;
        restrictedFunctionSig[keccak256(SEND_GAS)] = this.sendGas.selector;
    }
}
