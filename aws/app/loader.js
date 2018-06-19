let AWS = require('aws-sdk')
let s3 = new AWS.S3()

const BUCKET_NAME = 'dev.carbonvotex.io'
const CARBON_VOTE_X_JSON = 'CarbonVoteXBasic.json'
const CORE_JSON = 'CarbonVoteXCore.json'
const TOKEN_JSON = 'BasicTokenMock.json'
const CONFIG_JSON = 'config.json'

var getPromise = function (key) {
  var params = {
    Bucket: BUCKET_NAME,
    Key: key
  }

  var promise = s3.getObject(params, (err) => {
    if (err) {
      console.log('Get promise for file ' + key + ' failed.' + err)
    }
  }).promise()
  return promise
}

var loadInfo = async function () {
  const carbonVoteXPromise = getPromise(CARBON_VOTE_X_JSON)
  const tokenPromise = getPromise(TOKEN_JSON)
  const configPromise = getPromise(CONFIG_JSON)
  const corePromise = getPromise(CORE_JSON)

  var carbonVoteXJson
  var tokenJson
  var configJson
  var coreJson
  try {
    var carbonVoteXRes = await carbonVoteXPromise
    var tokenRes = await tokenPromise
    var configRes = await configPromise
    var coreRes = await corePromise
    carbonVoteXJson = JSON.parse(carbonVoteXRes.Body)
    tokenJson = JSON.parse(tokenRes.Body)
    configJson = JSON.parse(configRes.Body)
    coreJson = JSON.parse(coreRes.Body)
  } catch (e) {
    console.log('Promise Rejected:' + e)
    console.log('============Retry!')
    let info = await loadInfo()
    return info
  }
  const carbonVoteXAddress = Object.values(carbonVoteXJson['networks'])[0]['address']
  const carbonVoteXAbi = carbonVoteXJson['abi']
  const tokenAddress = Object.values(tokenJson['networks'])[0]['address']
  const tokenAbi = tokenJson['abi']
  const coreAddress = Object.values(coreJson['networks'])[0]['address']
  const coreAbi = coreJson['abi']

  var info = {
    carbonVoteXAbi: carbonVoteXAbi,
    carbonVoteXAddress: carbonVoteXAddress,
    tokenAbi: tokenAbi,
    tokenAddress: tokenAddress,
    config: configJson,
    coreAbi: coreAbi,
    coreAddress: coreAddress
  }
  return info
}

module.exports = loadInfo
