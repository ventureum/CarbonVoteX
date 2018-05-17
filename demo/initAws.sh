#!/bin/bash

config="conf/config.json"

accessKey=`cat $config | jq -r ".aws.access_key"`;
secretKey=`cat $config | jq -r ".aws.secret_key"`;
region=`cat $config | jq -r ".aws.region"`;
lambdaFunName=`cat $config | jq -r ".aws.lambda.function_name"`;
lambdaTimeout=`cat $config | jq -r ".aws.lambda.timeout"`;
lambdaRole=`cat $config | jq -r ".aws.lambda.role"`;



aws configure set aws_access_key_id $accessKey
aws configure set aws_secret_access_key $secretKey
aws configure set region $region
aws configure set output "json"

zip -r app.zip ../aws/app

aws lambda create-function \
    --function-name "$lambdaFunName" \
    --runtime "nodejs8.10" \
    --role "$lambdaRole" \
    --timeout "$lambdaTimeout" \
    --handler "app/index.handler" \
    --zip-file "fileb://./app.zip"

