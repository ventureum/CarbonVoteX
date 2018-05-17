let CarbonVoteX = require("./carbonVoteX.js");
let loadInfo = require("./loader.js");


exports.handler = (event, context, callback) => {
    main(event, context, callback);
};

var main = async function (event, context, callback) {
    let info = await loadInfo();
    let carbonVoteXInstance = new CarbonVoteX(info.carbonVoteX_address, info.carbonVoteX_abi,
        info.token_address, info.token_abi, info.config);

    if (event['name'] = 'getVotes') {
        carbonVoteXInstance.getVotes(event['pollId'], event['address'], callback);
    }
}


