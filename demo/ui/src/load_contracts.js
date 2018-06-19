import CarbonVoteX from  "./contracts/CarbonVoteXBasic.json"
import Core from  "./contracts/CarbonVoteXCore.json"
import Token from  "./contracts/BasicTokenMock.json"

let network = CarbonVoteX["networks"];

let voteABI = CarbonVoteX["abi"];
let voteAddress = Object.values(network)[0]['address'];

let tokenABI = Token["abi"];
let tokenAddress= Object.values(Token["networks"])[0]['address'];

let coreABI = Core["abi"];
let coreAddress = Object.values(Core["networks"])[0]['address'];

export {voteABI, voteAddress, tokenABI, tokenAddress, coreABI, coreAddress};
