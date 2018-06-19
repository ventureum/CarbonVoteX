#!/bin/bash

./awsCredentials.sh

truffle migrate --reset

./copyContracts.sh
./uploadAws.sh


