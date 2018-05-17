# CarbonVoteX

This is a fantastic vote system in block chain. You can use this system as a template to build your own vote system.


## Advantage:
#### 1. The entire voting process does not consume any tokens.
CarbonVoteX system record the token number at the beginning of this voting, using that number as the user available votes.
#### 2. The voting organizer speed least gas.
Organizer which support the back-end will not speed any gases if they don't participate in (register a vote poll or vote).
Organizer only need to pay the deploy gases and that's it.
When an user want vote, he/she need getVotes first witch will transfer small number of gases to organize because the organize will write the available votes for them,
then they can vote by using their available votes in this vote poll.

As a register, you need to pay one transaction gas for register a vote poll.
As a voter, you need to pay one transaction gas for each vote, one transaction gas for transfer eth to organizer.
As an organizer, you need to pay one transaction gas for deploy contracts.







