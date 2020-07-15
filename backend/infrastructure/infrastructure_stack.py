from aws_cdk import core
from aws_cdk import aws_apigateway
from aws_cdk import aws_lambda
from aws_cdk import aws_s3
from aws_cdk import aws_dynamodb
from aws_cdk import aws_s3_deployment
from aws_cdk import aws_cloudfront
from aws_cdk import aws_sns
from aws_cdk import aws_sns_subscriptions
from os import environ
from aws_cdk.aws_apigateway import AuthorizationType

class InfrastructureStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        sns_topic = aws_sns.Topic(self, "RescueCentreAPISNS")
        for i in open("emails.txt"):
            sns_topic.add_subscription(
                 aws_sns_subscriptions.EmailSubscription(i.replace("\r\n","").replace("\n","").replace(" ","")))
        
        # ******* API gateway
        # Create simple, publically available API gateway resource. The CORS stuff is only for preflight requests
        rescue_centre_api = aws_apigateway.RestApi(self, 'rescueCentreAPI', rest_api_name='rescueCentreAPI',
                                                   default_cors_preflight_options={
                                                       "allow_origins": ["*"],
                                                       "allow_methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"]
                                                   })
        # ******* COGNITO_USER_POOLS Auth
        auth = aws_apigateway.CfnAuthorizer(self, "adminSectionAuth", rest_api_id=rescue_centre_api.rest_api_id,
                                            type='COGNITO_USER_POOLS', identity_source='method.request.header.Authorization',
                                            provider_arns=[
                                                'arn:aws:cognito-idp:eu-west-2:040684591284:userpool/eu-west-2_3T4vtfKJE'],
                                            name="adminSectionAuth"
                                            )
        # ******* Create the databases and all the API resources We use the same Lambda code multiple times
        # and create very simlar resources so this is the simplest way of doing it for me Minimizes effect of typos also
        resources = {
                    "rehomers": {"methodsNotRequiringAuth": ["POST"], "methodsToExclude": []},
                    "horses": {"methodsNotRequiringAuth": ["GET"], "methodsToExclude": ["PUT"]},
                    "queries": {"methodsNotRequiringAuth": ["POST"], "methodsToExclude": ["PUT"]},
                    "volunteers": {"methodsNotRequiringAuth": ["POST"], "methodsToExclude": []}
                }
        methods = {"POST": "lambdas/createItemLambda", "PUT": "lambdas/createItemLambda", "DELETE": "lambdas/deleteItemLambda", "GET": "lambdas/getItemLambda"}
        for i in resources:
            resource = rescue_centre_api.root.add_resource(i)
            Table = aws_dynamodb.Table(
                self, i +"Table",
                partition_key=aws_dynamodb.Attribute(
                    name="id",
                    type=aws_dynamodb.AttributeType.STRING
                ),
                read_capacity=2,
                write_capacity=2,
                billing_mode=aws_dynamodb.BillingMode.PROVISIONED
            )
            for method in methods:
                if method not in resources[i]["methodsToExclude"]:
                    details = {"table": Table, "method": method, "resource": resource, "lambdaName":  i + method, "lambdaCode": methods[method],
                    "requiresAuth": True, "topic": sns_topic}
                    
                    if method in resources[i]["methodsNotRequiringAuth"]:
                        details["requiresAuth"] = False
                        self.makeLambda(details, auth)
                    else:
                        self.makeLambda(details, auth)

        # ******* S3 bucket
        websiteBucket = aws_s3.Bucket(self, "websiteBucket", bucket_name="www.leighrescuecentre.co.uk",
                                      public_read_access=True,
                                      website_index_document="index.html",
                                      cors=[{
                                          "allowedMethods": [aws_s3.HttpMethods.GET, aws_s3.HttpMethods.PUT, aws_s3.HttpMethods.HEAD, aws_s3.HttpMethods.POST, aws_s3.HttpMethods.DELETE],
                                          "allowedOrigins": ["*"],
                                          "allowedHeader": ["*"],
                                          "exposeHeader": ["ETag"]
                                      }]
                                      )
        imagesBucket = aws_s3.Bucket(self, "imagesBucket",
                                     bucket_name="media.leighrescuecentre.co.uk",
                                     public_read_access=True,
                                     website_index_document="index.html",
                                     cors=[{
                                         "allowedMethods": [aws_s3.HttpMethods.GET, aws_s3.HttpMethods.PUT, aws_s3.HttpMethods.HEAD, aws_s3.HttpMethods.POST, aws_s3.HttpMethods.DELETE],
                                         "allowedOrigins": ["*"],
                                         "allowedHeader": ["*"],
                                         "exposeHeader": ["ETag"]
                                     }]
                                     )

        # ******* CloudFront distribution
        distribution = aws_cloudfront.CloudFrontWebDistribution(self, "websiteBucketDistribution",
                                                                origin_configs=[aws_cloudfront.SourceConfiguration(
                                                                    s3_origin_source=aws_cloudfront.S3OriginConfig(
                                                                        s3_bucket_source=websiteBucket
                                                                    ),
                                                                    behaviors=[aws_cloudfront.Behavior(
                                                                        is_default_behavior=True)]
                                                                )
                                                                ]
                                                                )

        # ******* Deploy to bucket
        deployment = aws_s3_deployment.BucketDeployment(self, "deployStaticWebsite",
                                                        sources=[aws_s3_deployment.Source.asset(
                                                            "../frontend")],
                                                        destination_bucket=websiteBucket,
                                                        distribution=distribution
                                                        )
                                                        
    def makeLambda(self, details, auth):
        lambda_function = aws_lambda.Function(self, details["lambdaName"],
                                              handler='app.lambda_handler',
                                              runtime=aws_lambda.Runtime.PYTHON_3_8,
                                              code=aws_lambda.Code.from_asset(
                                                  details["lambdaCode"]),
        )

        lambda_integration = aws_apigateway.LambdaIntegration(
            lambda_function, proxy=True)
        if details.get("requiresAuth"):
            lambda_function.add_environment("requiresAuth", "True")
            method = details["resource"].add_method(details["method"], lambda_integration)
            method_resource = method.node.find_child('Resource')
            method_resource.add_property_override('AuthorizationType',
                                                       'COGNITO_USER_POOLS')
            method_resource.add_property_override(
                    'AuthorizerId',
                    {"Ref": auth.logical_id})
        else:
            details["resource"].add_method(
                details["method"], lambda_integration)

        lambda_function.add_environment(
            "TABLE_NAME", details["table"].table_name)

        if details["method"] == "GET":
            details["table"].grant_read_data(lambda_function)
        else:
            details["table"].grant_write_data(lambda_function)
        if details["topic"]:
            lambda_function.add_environment(
                "TOPIC_ARN", details["topic"].topic_arn)
            details["topic"].grant_publish(lambda_function)
