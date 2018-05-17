# CarbonVoteX Demo

### Prepare: 
AWS account, docker with [`truffle`, `pip`, `aws cli`, `zip`, `node`];


### 1. Fill in `conf/config.json`
You can leave the `backend_api_url` empty string for now.

### 2. Run script `initAws.sh`:
```
bash initAws.sh
```
this script will setup your aws secret key pair and create a lambda function.
### 3. Create a `post` in aws API Gateway, trigger function is the aws lambda function in step 2.

### 4. Run script `deploy.sh`
```
bash deploy.sh
```
this script will deploy the contract and copy the json files to s3 and ui.

### 5. Start the UI and have fun.
```
cd ui
npm start
```
then go to `http://localhost:3000/` and all done.









