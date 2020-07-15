# Leigh Rescue Centre Website
A pretty typical website, with the twist that it is built in a completely serverless manner, using a range of AWS 
services including Cognito to control access to the admin area, S3 & CloudFront for hosting, API Gateway, SNS, 
DynamoDB and Lambda. 

It's a small project I started partly to help my family, who run the rescue, as they were struggling to get horses 
rehomed and partly to get some real world experience.

The frontend is built using w3.css, a simple CSS framework, plain old HTML and vanilla JavaScript. It's hosted 
in S3 with CloudFront distribution, separate bucket for uploading images (deploying the frontend via CDK 
overwrites them otherwise). It integrates with ReCaptcha to protect public facing forms and the AWS SDK for auth 
with Cognito and secure direct upload to S3.

It uses REST to communicate with the backend, a API Gateway API, using Cognito to protect private endpoints, Lambda 
functions written in Python for compute, DynamoDB for storage and SNS for notifications. 

The infrastructure is defined using the Python variant of the AWS CDK.

## Running this Application
1. Ensure that the AWS CLI and CDK are properly setup on your computer
2. Run 
```bash
python3 -m pip install --system -r requirements.txt -t ./
```
in each subfolder of backend/lambdas to install dependencies (only works on Linux (inc WSL and Docker container))
3. Replace the values in config.js with your own (might have to do this after deploying)
4. Populate backend/emails.txt with a list of emails for the SNS topic targets
5. Put a ReCaptcha V2 key in backend/lambda/createItemLambda/keyV2.txt
6. Put a ReCaptcha V3 key in backend/lambda/createItemLambda/keyV3.txt
7. Run cdk deploy