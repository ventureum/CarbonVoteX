var CarbonVoteXCore = artifacts.require("./CarbonVoteXCore");
var CarbonVoteXBasic = artifacts.require("./CarbonVoteXBasic");
var BasicTokenMock = artifacts.require("./BasicTokenMock");
var config = require("../conf/config.json");
var Web3 = require ('web3');
var web3 = new Web3();


module.exports = function (deployer, network, accounts) {

    var InitialAccountSet = [
        accounts[0]
    ];
    for (var i = 1; i < config.initial_account_number; i++) {
        InitialAccountSet.push(accounts[i]);
    }
    var functions = [];
    for (var i = 0; i < config.initial_account_number; i++) {
        functions.push(web3.utils.sha3('sendGas'));
    }


    deployer.deploy(BasicTokenMock, InitialAccountSet, config.initial_balance);

    var fun = async function () {
        var instance = await CarbonVoteXCore.deployed();
        var namespace  = web3.utils.sha3('demo');
        await instance.setReceiver(namespace, CarbonVoteXBasic.address
            , [web3.utils.sha3("register")]);
        await instance.setPermissions(functions, InitialAccountSet);
    }

    deployer.deploy(CarbonVoteXCore, accounts[0])
        .then(() => {
            return deployer.deploy(
                CarbonVoteXBasic,
                web3.utils.sha3('demo'),
                CarbonVoteXCore.address
            )
        }).then(async () => {
            await fun();
        });

}
