#!/bin/bash

 aws lambda create-function \
    --function-name "carbonvotex-backend" \
    --runtime "nodejs8.10" \
    --role "arn:aws:iam::727151012682:role/lambda_basic_execution" \
    --handler "app/index.handler" \
    --zip-file "fileb://./app.zip"

