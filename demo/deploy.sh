#!/bin/bash


truffle migrate --reset
cp -r build/contracts ui/src/
cp -r conf/ ui/src/
./uploadAws.sh


