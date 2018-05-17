#!/bin/bash

zip -r app.zip app/
aws lambda update-function-code \
    --function-name "CarbonVoteXBackendLambda" \
    --zip-file "fileb://./app.zip" 


