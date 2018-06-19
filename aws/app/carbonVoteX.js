let Web3 = require('web3')

const NAMESPACE = 'namespace'
const ADDRESS = 'address'
const MASTER_PRIVATE_KEY = 'master_private_key'
const GAS_LIMIT = 'gas_limit'
const PROVIDER_URL = 'provider_url'

class CarbonVoteX {
  constructor (info) {
    this.web3 = new Web3(info.config[PROVIDER_URL])

    const account = this.web3.eth.accounts.privateKeyToAccount(info.config[MASTER_PRIVATE_KEY])
    this.web3.eth.accounts.wallet.add(account)
    this.web3.eth.defaultAccount = account[ADDRESS]
    this.defaultAccount = account[ADDRESS]
    this.contractInstance = new this.web3.eth.Contract(info.carbonVoteXAbi, info.carbonVoteXAddress)
    this.tokenInstance = new this.web3.eth.Contract(info.tokenAbi, info.tokenAddress)
    this.coreInstance = new this.web3.eth.Contract(info.coreAbi, info.coreAddress)

    this.gasLimit = info.config[GAS_LIMIT]

    this.namespace = this.web3.utils.sha3(info[NAMESPACE])
  }

  async getBalance (pollId, address, callback) {
    let poll = await this.getPoll(pollId)
    let bal = await this.balanceOfByBlock(address, poll[0])
    if (poll === false || bal === -1) {
      callback('Error: get poll failed or get balance failed.')
      return -1
    }
    return bal
  }

  async getGas (pollId, address, callback) {
    console.log('processing getGas...')
    let bal = await this.getBalance(pollId, address, callback)
    this.coreInstance.methods.writeAvailableVotes(this.namespace, pollId, address,
      bal).estimateGas({from: this.defaultAccount, gas: this.gasLimit})
      .then((gasAmount) => {
        console.log('gas amount ' + gasAmount)
        callback(null, {
          'statusCode': 200,
          'state': 'res',
          'body': gasAmount
        })
      })
      .catch((err) => {
        callback({
          'statusCode': 200,
          'state': 'err',
          'err': err
        })
      })
  }

  /**
     *
     */
  async getVotes (pollId, address, callback) {
    console.log('processing getVotes...')
    let bal = await this.getBalance(pollId, address)

    var bool = await this.coreInstance.methods.voteObtained(this.namespace, pollId, address).call()
    if (bool === true) {
      callback(null, {
        'statusCode': 200,
        'err': 'Failed: already get vote.'
      })
      return
    }
    var gas = await this.coreInstance.methods.getGasSent(this.namespace, pollId, address).call()
    var estimateGas = await this.coreInstance.methods.writeAvailableVotes(this.namespace, pollId, address,
      bal).estimateGas({from: this.defaultAccount, gas: this.gasLimit})
    if (gas < estimateGas) {
      callback(null, {
        'statusCode': 200,
        'err': 'Failed: transaction need ' + estimateGas + ' gases, you only payed ' + gas + ' gases.'
      })
      return
    }

    this.coreInstance.methods.writeAvailableVotes(this.namespace, pollId, address,
      bal).send({from: this.defaultAccount, gas: this.gasLimit})
      .on('transactionHash', (hash) => {
        callback(null, {
          'statusCode': 200,
          'body': hash
        })
      })
  }

  async balanceOfByBlock (address, blockNum) {
    try {
      let bal = await this.tokenInstance.methods.balanceOf(address).call('undefined',
        blockNum)
      return bal
    } catch (e) {
      console.log('get balance failed. Failed message: ' + e)
      return -1
    }
  }

  async balanceOf (address) {
    try {
      let bal = await this.tokenInstance.methods.balanceOf(address).call()
      return bal
    } catch (e) {
      console.log('get balance failed. Failed message: ' + e)
      return -1
    }
  }

  async transfer (address, val) {
    try {
      await this.tokenInstance.methods.transfer(address, val)
        .send({from: this.defaultAccount, gas: this.gasLimit})
    } catch (e) {
      console.log('transfer failed. Failed message: ' + e)
    }
  }

  async getPoll (pollId) {
    try {
      let poll = await this.contractInstance.methods.getPoll(pollId)
        .call({from: this.defaultAccount, gas: this.gasLimit})
      console.log('poll:' + JSON.stringify(poll))
      return poll
    } catch (e) {
      console.log('get poll failed. Failed message: ' + e)
      return false
    }
  }
}

module.exports = CarbonVoteX
