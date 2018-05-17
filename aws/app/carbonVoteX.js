let Web3 = require('web3');

class CarbonVoteX {
    constructor(carbonVoteXAddress, carbonVoteXAbi, tokenAddress, tokenAbi, config) {
        this.web3 = new Web3(config["provider_url"]);

        const account = this.web3.eth.accounts.privateKeyToAccount(config["master_private_key"]);
        this.web3.eth.accounts.wallet.add(account);
        this.web3.eth.defaultAccount = account['address'];
        this.defaultAccount = account['address'];

        this.contractInstance = new this.web3.eth.Contract(carbonVoteXAbi, carbonVoteXAddress);
        this.tokenInstance = new this.web3.eth.Contract(tokenAbi, tokenAddress);

        this.gasLimit = config['gas_limit'];
    }

    /**
     * @
     *
     */
    async getVotes (pollId, address, callback) {
        console.log("processing getVotes...");
        let poll = await this.getPoll(pollId);
        let bal = await this.balanceOfByBlock(address, poll[0]);
        if (poll == false || bal == -1) {
            callback("Error: get poll failed or get balance failed.");
            return;
        }
        this.contractInstance.methods.writeAvailableVotes(pollId, address,
            bal).send({from: this.defaultAccount, gas: this.gasLimit})
            .on("transactionHash", (hash) => {
                callback(null, "success :" + hash);
            });
    }

    async balanceOfByBlock (address, blockNum) {
        try {
            let bal = await this.tokenInstance.methods.balanceOf(address).call('undefined',
                blockNum);
            return bal;
        } catch (e) {
            console.log("get balance failed. Failed message: " + e);
            return -1;
        }
    }

    async balanceOf (address) {
        try {
            let bal = await this.tokenInstance.methods.balanceOf(address).call();
            return bal;
        } catch (e) {
            console.log("get balance failed. Failed message: " + e);
            return -1;
        }
    }

    async transfer (address, val) {
        try {
            let tx = await this.tokenInstance.methods.transfer(address, val).
                send({from: this.defaultAccount, gas: this.gasLimit});
        } catch (e) {
            console.log("transfer failed. Failed message: " + e);
        }

    }

    async getPoll (pollId) {
        try {
            let poll = await this.contractInstance.methods.getPoll(pollId).
                call({from: this.defaultAccount, gas: this.gasLimit});
            console.log("poll:" + JSON.stringify(poll));
            return poll;
        } catch (e) {
            console.log("get poll failed. Failed message: " + e);
            return false;
        }
    }
}

module.exports = CarbonVoteX;

