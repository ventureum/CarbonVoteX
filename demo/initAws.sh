#!/bin/bash

config="conf/config.json"

./awsCredentials.sh

region=`cat $config | jq -r ".aws.region"`;
lambdaFunName=`cat $config | jq -r ".aws.lambda.function_name"`;
lambdaTimeout=`cat $config | jq -r ".aws.lambda.timeout"`;
lambdaRole=`cat $config | jq -r ".aws.lambda.role"`;




zip -r app.zip ../aws/app

aws lambda create-function \
    --function-name "$lambdaFunName" \
    --runtime "nodejs8.10" \
    --role "$lambdaRole" \
    --timeout "$lambdaTimeout" \
    --handler "app/index.handler" \
    --zip-file "fileb://./app.zip"

