pragma solidity ^0.4.23;

// @notice This interface is intended to enhance CarbonVoteXCore
// @notice "receiver" is as to receive the core functionalities of CarbonVoteXCore
interface ICarbonVoteXReceiver {

	// @param pollId UUID (hash value) of a poll
	// @param voter address of a voter    
	// @param votes number of votes to write
    function writeAvailableVotes(bytes32 pollId, address voter, uint votes) external;
}
