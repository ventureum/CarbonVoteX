let AWS = require('aws-sdk');
let s3 = new AWS.S3();

const BUCKET_NAME = 'dev.carbonvotex.io';
const CARBON_VOTE_X_JSON = 'CarbonVoteX.json';
const TOKEN_JSON =  'BasicTokenMock.json';
const CONFIG_JSON =  'config.json';


var getPromise = function (key) {
    var params = {
        Bucket: BUCKET_NAME,
        Key: key
    };

    var promise = s3.getObject(params, (err) => {
        if (err) {
            console.log("Get promise for file " + key + " failed." + err);
        }
    }).promise();
    return promise;
}

var loadInfo = async function () {
    const carbonVoteXPromise = getPromise(CARBON_VOTE_X_JSON);
    const tokenPromise = getPromise(TOKEN_JSON);
    const configPromise = getPromise(CONFIG_JSON);

    var carbonVoteXJson;
    var tokenJson;
    var configJson;
    try {
        var carbonVoteXRes = await carbonVoteXPromise;
        var tokenRes = await tokenPromise;
        var configRes = await configPromise;
        carbonVoteXJson = JSON.parse(carbonVoteXRes.Body);
        tokenJson = JSON.parse(tokenRes.Body);
        configJson = JSON.parse(configRes.Body);
    } catch (e) {
        console.log("Promise Rejected:" + e);
        console.log("============Retry!");
        return await loadInfo();
    }
    const carbonVoteXAddress = Object.values(carbonVoteXJson["networks"])[0]['address'];
    const carbonVoteXAbi = carbonVoteXJson['abi'];
    const tokenAddress = Object.values(tokenJson["networks"])[0]['address'];
    const tokenAbi = tokenJson['abi'];

    var info = {
        carbonVoteX_abi : carbonVoteXAbi,
        carbonVoteX_address : carbonVoteXAddress,
        token_abi : tokenAbi,
        token_address : tokenAddress,
        config : configJson,
    }
    return info;
}

module.exports = loadInfo;
