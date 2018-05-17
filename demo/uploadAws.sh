#!/bin/bash

config="conf/config.json"
bucketName=`cat $config | jq -r ".aws.s3.bucket_name"`

aws s3 cp build/contracts/ s3://$bucketName/ --recursive
aws s3 cp conf s3://$bucketName/ --recursive


