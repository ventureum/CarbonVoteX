import {voteABI, voteAddress, tokenABI, tokenAddress, coreABI, coreAddress} from './load_contracts.js';
import conf from "./conf/config.json";

const LOADER_URL = conf.loader_url;
const BACKEND_API_URL = conf.aws.api_gateway.invoke_url;

/**
 * Core class of front-end of CarbonVoteX system.
 * Develop for use can easily try and test CarbonVoteX system.
 *
 */
class CarbonVoteX {
    /**
     * Default Constructor, require install metamask in your web browser.
     */
    constructor() {
        this.web3 = new window.Web3(window.web3.currentProvider);
        this.web3.defaultAccount = window.web3.eth.accounts[0];
        this.namespace = this.web3.sha3("demo")

        let carbonVoteXContract = this.web3.eth.contract(voteABI);
        let tokenContract = this.web3.eth.contract(tokenABI);
        let coreContract = this.web3.eth.contract(coreABI);

        this.carbonVoteXInstance = carbonVoteXContract.at(voteAddress);
        this.tokenInstance = tokenContract.at(tokenAddress);
        this.coreInstance = coreContract.at(coreAddress);

        this.initStringFormat();
    }

    /**
     * Enable String format.
     */
    initStringFormat () {
        String.prototype.format = function () {
            var args = [].slice.call(arguments);
            return this.replace(/(\{\d+\})/g, function (a){
                return args[+(a.substr(1,a.length-2))||0];
            });
        };
    }

    /**
     * update web3 default Account before invoke each function .
     */
    updateAccount () {
        this.web3.defaultAccount = this.web3.eth.accounts[0];
    }

    /**
     * turn on/off loader image.
     * @app: An App object which used to setState
     * @sw: bool, true for on, false for off.
     */
    loaderSwitch (app, sw) {
        app.state.loader = sw ? LOADER_URL : "";
        app.forceUpdate();
    }

    /**
     * Show Transaction hash to state.show
     * @app: An App object which used to setState
     * @res: transaction hash
     */
    showTransactionMessage(app, res) {
        var transMsg = "Transaction success, transaction hash: {0}; " +
            "waiting for result...";
        app.setState({show: transMsg.format(res)});

    }

    async getEstimateGas (pollId, address) {
        var data = {
            "name" : "getGas",
            "address" : address,
            "pollId" : this.web3.sha3(pollId)
        };


        var res = await fetch(BACKEND_API_URL, {
            method :"POST",
            body: JSON.stringify(data),
            async: true,
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        })
        const promise = res.json();
        return promise;
        //    .then((res) => {
        //    const promise = res.json()
        //    promise.then((res) => {
        //        console.log(res);
        //        return res
        //    }, (err) => {
        //        console.log(err);
        //        return err
        //    })
        //});
    }

    async getGas (app) {
        const address = this.web3.defaultAccount;

        var pollId = app.state.pollId;
        if (!pollId) {
            app.setState({show: "Please enter poll id."});
            return;
        }
        app.setState({show: "waiting for result..."});
        this.loaderSwitch(app, 1);
        var res = await this.getEstimateGas(pollId, address);
        console.log(res)
        this.loaderSwitch(app, 0);

        if (res.state == "err") {
            app.setState({show: "Get gas err: " + res.err})
        } else {
            app.setState({show: "estimate gas is : " + res.body})
        }
    }

    async sendGas (app) {
        const address = this.web3.defaultAccount;
        var pollId = app.state.pollId;
        if (!pollId) {
            app.setState({show: "Please enter poll id."});
            return;
        }

        var value = app.state.gas;
        if (!value) {
            app.setState({show: "Please enter gas number."});
            return;
        }
        app.setState({show: "waiting for result..."});
        this.loaderSwitch(app, 1);

        var SendGasEvent = this.coreInstance._SendGas();
        SendGasEvent.watch((err, res) => {
            this.loaderSwitch(app, 0);
            if (err) {
                app.setState({show: "send gas err: " + res.err})
            } else {
                app.setState({show: "send gas success, sender: {0}, value: {1}, pollId: {2}".format(
                    res.args.msgSender, res.args.value, res.args.pollId)});
            }
        })

        //console.log("beginning estimate gas")
        //var gas = await this.getEstimateGas(pollId, address);
        //if (gas.state != 'res') {
        //    app.setState({show: "get estimate gas failed, please check permission"});
        //    return;
        //}
        //console.log("beginning send gas")
        //const value = gas.body

        console.log("namespace " + this.namespace )
        console.log("pollId " + pollId)
        console.log("address " + this.web3.defaultAccount)
        console.log("value " + value)
        this.coreInstance.sendGas.sendTransaction(this.namespace, this.web3.sha3(pollId),
            {from: this.web3.defaultAccount, value: value}, (err, res) => {
                console.log("after send gas")
                if (err) {
                    app.setState({show: "send gas err " + err});
                } else {
                    this.showTransactionMessage(app, res);
                }
            });
    }

    /*
     * call backend Api to check and write available votes.
     * @app: An App object which used to setState
     */
    async getVotes (app) {

        var url = BACKEND_API_URL;
        const address = this.web3.defaultAccount;

        var pollId = app.state.pollId;
        if (!pollId) {
            app.setState({show: "Please enter poll id."});
            return;
        }

        app.setState({show: "get votes processing..."});

        var writeAvailableVotesEvent = this.coreInstance._WriteAvailableVotes();
        this.loaderSwitch(app, 1);
        writeAvailableVotesEvent.watch((err, res) => {
            this.loaderSwitch(app, 0);
            if (err) {
                app.setState({show: "Write available votes Error: " + err});
            } else {
                var successMsg = "Write avaiable votes success: \n\n\npoll id: {0}\nvoter: {1}\n" +
                    "votes: {2}\nsender address: {3}";
                app.setState({show: successMsg.format(res.args.pollId, res.args.voter,
                    res.args.votes, res.args.msgSender)});
            }
        });


        var data = {
            "name" : "getVotes",
            "address" : address,
            "pollId" : this.web3.sha3(pollId)
        };

        fetch(url, {
            method :"POST",
            body: JSON.stringify(data),
            async: true,
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }).then((res)=> {
            return res.json()
        }).then((res) => {
            if (res.err) {
                this.loaderSwitch(app, 0);
                app.setState({show: "send transaction failed: {0}, please try again.".format(res.err)});
                return;
            }
            app.setState({show: "tx is {0}, set votes processing....".format(res.body)});
        }, (err) => {
            this.loaderSwitch(app, 0);
            app.setState({show: "fetch failed: {0}, please try again.".format(err)});
        }).catch(e => {
            this.loaderSwitch(app, 0);
            app.setState({show: "catch error: {0}, please try again.".format(e)});

        })
    }

    /*
     * Get the balance for current user
     * @app: An App object which used to setState
     */
    async balanceOf (app) {
        var address = this.web3.defaultAccount;
        this.loaderSwitch(app, 1);
        this.tokenInstance.balanceOf(address, (err, res) => {
            this.loaderSwitch(app, 0);
            if (err) {
                app.setState({show: "balanceOf Call Error + " + err});
            } else {
                app.setState({show: "Your current balance: {0}.".format(res)});
            }
        });
    }

    /*
     * transfer from current user to transTo.
     * @app: An App object which used to setState
     */
    async transfer (app) {
        var val = app.state.tokenNum;
        if (!val) {
            app.setState({show: "Please enter the TokenNum."});
            return;
        }

        var toAddr = app.state.transAddr;
        if (!toAddr) {
            app.setState({show: "Please enter the transfer address."});
            return;
        }


        var TransferEvent = this.tokenInstance.Transfer();
        TransferEvent.watch((err, res) => {
            this.loaderSwitch(app, 0);
            if (err) {
                app.setState({show: "Transfer Error: " + err});
            } else {
                var successMsg = "Transfer success. from: {0}; to: {1}; value: {2};";
                app.setState({show: successMsg.format(res.args.from, res.args.to,
                    res.args.value)});
            }
        });

        val = this.web3.toBigNumber(val);

        this.loaderSwitch(app, 1);
        this.tokenInstance.transfer(toAddr, val, (err, res) => {
            if (err) {
                this.loaderSwitch(app, 0);
                app.setState({show: "Error + " + err });
            } else {
                this.showTransactionMessage(app, res);
            }
        });
    }


    /*
     * register a poll
     * @app: An App object which used to setState
     */
    async register (app) {
        var pollId = app.state.pollId;
        if (!pollId) {
            app.setState({show: "Please enter poll id."});
            return;
        }

        var startTime = app.state.startBlock;
        if (!startTime) {
            app.setState({show: "Please enter start time."});
            return;
        }

        var endTime = app.state.endBlock;
        if (!endTime) {
            app.setState({show: "Please enter end time."});
            return;
        }

        pollId = this.web3.sha3(pollId);
        startTime = parseInt(startTime, 10);


        var registerEvent = this.coreInstance._Register();
        this.loaderSwitch(app, 1);
        registerEvent.watch((err, res) => {
            this.loaderSwitch(app, 0);
            if (err) {
                app.setState({show: "Error: " + err});
            } else {
                var successMsg = "register success. poll id: {0}; start block: {1}; " +
                    "end block: {2}; token address: {3};";
                app.setState({show: successMsg.format(res.args.pollId, res.args.startBlock,
                    res.args.endBlock, res.args.tokenAddr)});
            }
        });

        this.carbonVoteXInstance.startPoll.sendTransaction(startTime, endTime ,pollId,
            tokenAddress, (err, res) => {
                if (err) {
                    this.loaderSwitch(app, 0);
                    app.setState({show: "Transaction Error: " + err});
                } else {
                    this.showTransactionMessage(app, res);
                }
            });
    }

    /*
     * get poll info.
     * @app: An App object which used to setState
     */
    async checkPoll (app) {
        var pollId = app.state.pollId;
        if (!pollId) {
            app.setState({show: "Please enter poll id."});
            return;
        }
        pollId = this.web3.sha3(pollId);

        this.loaderSwitch(app, 1);
        this.carbonVoteXInstance.getPoll(pollId, (err, res) => {
            this.loaderSwitch(app, 0);
            if (err) {
                app.setState({show: "getPoll Error: " + err});
            } else {
                var successMsg = "Poll info: pollId: {2}, start block: {0}, end block {1}";
                app.setState({show: successMsg.format(res[0], res[1], pollId)});
            }
        });
    }

    /*
     * vote for a choice.
     * @app: An App object which used to setState
     */
    async vote (app) {
        var pollId = app.state.pollId
        if (!pollId) {
            app.setState({show: "Please enter poll id."});
            return;
        }
        var choice = app.state.choice
        if (!choice) {
            app.setState({show: "Please enter choice."});
            return;
        }
        var votes = app.state.votes
        if (!votes) {
            app.setState({show: "Please enter votes."});
            return;
        }
        pollId = this.web3.sha3(pollId);
        choice = this.web3.sha3(choice);

        var voteEvent = this.carbonVoteXInstance._Vote();
        this.loaderSwitch(app, 1);
        voteEvent.watch((err, res) => {
            this.loaderSwitch(app, 0);
            if (err) {
                app.setState({show: "Error: " + err});
            } else {
                var successMsg = "vote success: poll id: {0};choice: {1}; votes: {2};" +
                    "sender address: {3};";
                app.setState({show: successMsg.format(res.args.pollId, res.args.choice,
                    res.args.votes, res.args.msgSender)});
            }
        });

        this.carbonVoteXInstance.vote(pollId, choice, parseInt(votes, 10), (err, res) => {
            if (err) {
                this.loaderSwitch(app, 0);
                app.setState({show: "Vote failed: " + err})
            } else {
                this.showTransactionMessage(app, res);
            }
        });
    }

    /*
     * check votes for a choice by all users
     * @app: An App object which used to setState
     */
    async checkAllVotes (app) {
        var pollId = app.state.pollId;
        if (!pollId) {
            app.setState({show: "Please enter poll id."});
            return;
        }
        var choice = app.state.choice
        if (!choice) {
            app.setState({show: "Please enter choice."});
            return;
        }
        pollId = this.web3.sha3(pollId);
        choice = this.web3.sha3(choice);

        this.loaderSwitch(app, 1);
        this.carbonVoteXInstance.getVotingResult(pollId, choice, (err, res) => {
            this.loaderSwitch(app, 0);
            if (err) {
                app.setState({show: "Check votes error:" + err});
            } else {
                app.setState({show: "This choice has been voted: {0} votes.".format(res)});
            }
        });
    }

    /*
     * check votes for a choice by yourself
     * @app: An App object which used to setState
     */
    async checkSelfVotes (app) {
        var pollId = app.state.pollId;
        if (!pollId) {
            app.setState({show: "Please enter poll id."});
            return;
        }
        var choice = app.state.choice
        if (!choice) {
            app.setState({show: "Please enter choice."});
            return;
        }
        pollId = this.web3.sha3(pollId);
        choice = this.web3.sha3(choice);
        var address = this.web3.defaultAccount;

        this.loaderSwitch(app, 1);
        this.carbonVoteXInstance.getVotingResultByVoter(pollId, address, choice, (err, res) => {
            this.loaderSwitch(app, 0);
            if (err) {
                app.setState({show: "Check votes error:" + err});
            } else {
                app.setState({show: "You have been voted: {0} votes.".format(res)});
            }
        });

    }

    /*
     * get current block
     * @app: An App object which used to setState
     */
    async currentBlock (app) {
        this.loaderSwitch(app, 1);
        this.web3.eth.getBlockNumber((err, res) => {
            this.loaderSwitch(app, 0);
            if (err) {
                app.setState({show: "Get current block number failed: " + err});
            } else {
                app.setState({show: "Current block number is : {0}".format(res)});
            }
        })
    }

    /*
     * set start block to current block
     * @app: An App object which used to setState
     */
    async setCurrentBlock (app) {
        this.loaderSwitch(app, 1);
        this.web3.eth.getBlockNumber((err, res) => {
            this.loaderSwitch(app, 0);
            if (err) {
                app.setState({startBlock: 0});
            } else {
                app.setState({startBlock: res});

            }
        })
    }

    /*
     * get available votes for current user
     * @app: An App object which used to setState
     */
    async availableVotes (app) {
        var pollId = app.state.pollId;
        if (!pollId) {
            app.setState({show: "Please enter poll id."});
            return;
        }

        pollId = this.web3.sha3(pollId);
        var address = this.web3.defaultAccount;

        this.loaderSwitch(app, 1);
        this.carbonVoteXInstance.readAvailableVotes(pollId, address, (err, res) => {
            this.loaderSwitch(app, 0);
            if (err) {
                app.setState({show: "Get available votes failed: " + err});
            } else {
                app.setState({show: "Your available votes is {0}.".format(res)});
            }
        });
    }


}

export default CarbonVoteX;

