pragma solidity ^0.4.23;


import "openzeppelin-solidity/contracts/token/ERC20/BasicToken.sol";


// mock class using BasicToken
contract BasicTokenMock is BasicToken {

  constructor(address[] initialAccountSet, uint256 initialBalance) public {
    for (uint i = 0; i < initialAccountSet.length; i++) {
        balances[initialAccountSet[i]] = initialBalance;
    }
    totalSupply_ = initialAccountSet.length * initialBalance;
  }

}
