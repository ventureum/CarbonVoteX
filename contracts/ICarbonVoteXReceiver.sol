pragma solidity ^0.4.23;

interface ICarbonVoteXReceiver {
    function writeAvailableVotes(bytes32 pollId, address voter, uint votes) external;
}
