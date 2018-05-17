import React, { Component } from 'react';
import CarbonVoteX from './carbonVoteX.js'
import './App.css';

class App extends Component {
    constructor (props) {
        super(props);
        this.state = {};
        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.carbonVoteX = new CarbonVoteX();
    }

    componentDidMount () {

    }

    handleChange(e) {
        this.setState({[e.target.id]: e.target.value});
    }

    handleClick(e) {
        this.carbonVoteX.updateAccount();
        var functionName = e.target.id;
        if (functionName === "checkPoll") {
            this.carbonVoteX.checkPoll(this);
        }
        if (functionName === "register") {
            this.carbonVoteX.register(this);
        }
        if (functionName === "balanceOf") {
            this.carbonVoteX.balanceOf(this);
        }
        if (functionName === "transfer") {
            this.carbonVoteX.transfer(this);
        }
        if (functionName === "getVotes") {
            this.carbonVoteX.getVotes(this);
            //this.carbonVoteX.getVotes(this);
        }
        if (functionName === "vote") {
            this.carbonVoteX.vote(this);
        }
        if (functionName === "availableVotes") {
            this.carbonVoteX.availableVotes(this);
        }
        if (functionName === "currentBlock") {
            this.carbonVoteX.currentBlock(this);
        }
        if (functionName === "checkSelf") {
            this.carbonVoteX.checkSelfVotes(this);
        }
        if (functionName === "checkAll") {
            this.carbonVoteX.checkAllVotes(this);
        }


    }

    render() {
        return (
            <div className="App"> <header className="App-header">
            <h1 className="App-title">CarbonVoteX</h1>
            </header>
            PollId:  <input id="pollId" onChange={this.handleChange} type="text"/>
            <p />
            Choice:  <input id="choice" onChange={this.handleChange} type="text"/>
            <p />
            Votes: <input id="votes" onChange={this.handleChange} type="number"/>
            <p />
            StartBlock: <input id="startBlock" onChange={this.handleChange} type="number"/>
            <p />
            EndBlock: <input id="endBlock" onChange={this.handleChange} type="number"/>
            <p />
            Transfer token number: <input id="tokenNum" onChange={this.handleChange} type="number"/>
            <p />
            Transfer address(to): <input id="transAddr" onChange={this.handleChange} type="text"/>
            <p />

            <button id="register" onClick ={this.handleClick}>Register</button>
            <button id="getVotes" onClick ={this.handleClick}>GetVotes</button>
            <button id="vote" onClick ={this.handleClick}>Vote</button>
            <br/>
            <button id="checkPoll" onClick ={this.handleClick} >Check Poll </button>
            <button id="availableVotes" onClick ={this.handleClick}>Check available votes</button>
            <button id="checkSelf" onClick ={this.handleClick}>Check self votes</button>
            <button id="checkAll" onClick ={this.handleClick}>Check all votes</button>
            <br/>
            <button id="balanceOf" onClick ={this.handleClick}>BalanceOf</button>
            <button id="transfer" onClick ={this.handleClick}>Transfer</button>
            <button id="currentBlock" onClick ={this.handleClick}>Current Block</button>
            <h3 className="show"> {this.state.show} </h3>
            <img alt="" id="loader" src={this.state.loader}/>
            </div>
        );
    }
}

export default App;
