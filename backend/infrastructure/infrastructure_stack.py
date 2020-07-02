from aws_cdk import core
from aws_cdk import aws_apigateway
from aws_cdk import aws_lambda
from aws_cdk import aws_s3
from aws_cdk import aws_dynamodb
from aws_cdk import aws_s3_deployment
from aws_cdk import aws_cloudfront

class InfrastructureStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        # ******* Database
        rehomerTable = aws_dynamodb.Table(
            self, "rehomerTable",
            partition_key=aws_dynamodb.Attribute(
                name="id",
                type=aws_dynamodb.AttributeType.STRING
            ),
            read_capacity=2,
            write_capacity=2,
            billing_mode=aws_dynamodb.BillingMode.PROVISIONED,
            time_to_live_attribute="expires"
        )

        # ******* Lambdas and API gateway
        # Create simple, publically available API gateway resource. The CORS stuff is only for preflight requests
        rescue_centre_api = aws_apigateway.RestApi(self, 'rescueCentreAPI', rest_api_name='rescueCentreAPI',
                                                default_cors_preflight_options={
                                                    "allow_origins": ["*"],
                                                    "allow_methods": ["GET", "POST", "OPTIONS"]
                                                })

        # Create URL paths
        rehomers_resource = rescue_centre_api.root.add_resource('rehomers')
        rehomers_lambda_function = aws_lambda.Function(self, "rehomers_lambda",
                                              handler='app.lambda_handler',
                                              runtime=aws_lambda.Runtime.PYTHON_3_8,
                                              code=aws_lambda.Code.from_asset(
                                                  "../lambdas/rehomersLambda"),
                                              )
        # Make intergration
        rehomers_lambda_integration = aws_apigateway.LambdaIntegration(rehomers_lambda_function, proxy=True)
        rehomers_resource.add_method('POST', rehomers_lambda_integration)
        # ******* environment variables
        #rehomer_lambda_function.add_environment(
        #    "TABLE_NAME", rehomerTable.table_name)

        # ******* function permissions
        #rehomerTable.grant_write_data(rehomer_lambda_function)

        # ******* S3 bucket
        websiteBucket = aws_s3.Bucket(self, "websiteBucket",
           public_read_access=True,      
           website_index_document="index.html"
        )

        # ******* CloudFront distribution
        distribution = aws_cloudfront.CloudFrontWebDistribution(self, "websiteBucketDistribution",
           origin_configs=[aws_cloudfront.SourceConfiguration(
               s3_origin_source=aws_cloudfront.S3OriginConfig(
                   s3_bucket_source=websiteBucket
               ),
               behaviors=[aws_cloudfront.Behavior(is_default_behavior=True)]
           )
           ]
        )

        # ******* Deploy to bucket
        deployment = aws_s3_deployment.BucketDeployment(self, "deployStaticWebsite", 
           sources=[aws_s3_deployment.Source.asset("../frontend")],
           destination_bucket=websiteBucket,
           distribution=distribution
        )

