# Rescue Centre Website
A pretty typical website, with the twist that it is built in a completely serverless manner, using a range of AWS 
services including Cognito to control access to the admin area, S3 & CloudFront for hosting, API Gateway, SNS, 
DynamoDB and Lambda.

I built it as if it was for a horse and pony rescue centre I personally know very well, to provide real world context 
(they prefer to operate via Facebook so this isn't actually in production). The goal was to build a complete, 
functional serverless application. I feel I acheived this, and I learnt a lot in the process.

The frontend is built using w3.css, a simple CSS framework, plain old HTML and vanilla JavaScript. It's hosted 
in S3 with a CloudFront distribution, separate bucket for uploading images (deploying the frontend via CDK 
overwrites them otherwise). It integrates with ReCaptcha to protect public facing forms and the AWS SDK for auth 
with Cognito and secure direct upload to S3.

It uses REST to communicate with the backend, a API Gateway API, using Cognito to protect private endpoints, Lambda 
functions written in Python for compute, DynamoDB for storage and SNS for notifications. 

The infrastructure is defined using the Python variant of the AWS CDK.

See the readmes in the frontend and backend folders for more details
