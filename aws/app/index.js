let CarbonVoteX = require('./carbonVoteX.js')
let loadInfo = require('./loader.js')

const NAMESPACE = 'namespace'
const NAME = 'name'
const GET_VOTES = 'getVotes'
const GET_GAS = 'getGas'
const POLL_ID = 'pollId'
const ADDRESS = 'address'

exports.handler = (event, context, callback) => {
  main(event, context, callback)
}

var main = async function (event, context, callback) {
  let info = await loadInfo()
  info[NAMESPACE] = event[NAMESPACE]
  let carbonVoteXInstance = new CarbonVoteX(info)

  if (event[NAME] === GET_VOTES) {
    carbonVoteXInstance.getVotes(event[POLL_ID], event[ADDRESS], callback)
  }
  if (event[NAME] === GET_GAS) {
    carbonVoteXInstance.getGas(event[POLL_ID], event[ADDRESS], callback)
  }
}
