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
        # ******* Lambda functions
        '''rehomer_lambda_function = aws_lambda.Function(self, "HandleBookUploadLambda",
                                                          handler='app.lambda_handler',
                                                          runtime=aws_lambda.Runtime.PYTHON_3_8,
                                                          code=aws_lambda.Code.from_asset(
                                                              '../Functions/handlers/handle_book_upload'))'''

        # ******* S3 upload buckets
        websiteBucket = aws_s3.Bucket(self, "websiteBucket",
           public_read_access=True,      
           website_index_document="index.html"
        )
        distribution = aws_cloudfront.CloudFrontWebDistribution(self, "websiteBucketDistribution",
           origin_configs=[aws_cloudfront.SourceConfiguration(
               s3_origin_source=aws_cloudfront.S3OriginConfig(
                   s3_bucket_source=websiteBucket
               ),
               behaviors=[aws_cloudfront.Behavior(is_default_behavior=True)]
           )
           ]
       )
        deployment = aws_s3_deployment.BucketDeployment(self, "deployStaticWebsite", 
           sources=[aws_s3_deployment.Source.asset("../frontend")],
           destination_bucket=websiteBucket,
           distribution=distribution
        )

        # ******* environment variables
        #rehomer_lambda_function.add_environment(
        #    "TABLE_NAME", rehomerTable.table_name)

        # ******* function permissions
        #rehomerTable.grant_write_data(rehomer_lambda_function)