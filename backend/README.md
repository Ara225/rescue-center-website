
# Infrastructure and backend for Leigh Rescue Centre Website
Defined with the AWS CDK. The actual meat of it is in infrastructure/infrastructure_stack.py.
lambdas/ contains the code of the Python lambdas. There are only three, as they are duplicated for each 
endpoint - this allows there to be different environment variables and permissions for each, to minimize 
security risks.  

## Running this Application
1. Ensure that the AWS CLI and CDK CLI are properly setup on your computer (see the AWS documentation)
2. 
```
cd ./backend 
pip install -r requirements.txt
```
3. Run 
```bash
python3 -m pip install --system -r requirements.txt -t ./
```
in each subfolder of backend/lambdas to install dependencies (only works on Linux (inc WSL and Docker container))
4. Replace the values in config.js with your own (might have to do this after deploying)
5. Populate backend/emails.txt with a list of emails for the SNS topic targets
6. Put a ReCaptcha V2 key in backend/lambda/createItemLambda/keyV2.txt
7. Put a ReCaptcha V3 key in backend/lambda/createItemLambda/keyV3.txt
8. Run cdk deploy