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

See the readmes in the frontend and backend folders for more details