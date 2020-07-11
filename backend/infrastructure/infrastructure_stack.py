from aws_cdk import core
from aws_cdk import aws_apigateway
from aws_cdk import aws_lambda
from aws_cdk import aws_s3
from aws_cdk import aws_dynamodb
from aws_cdk import aws_s3_deployment
from aws_cdk import aws_cloudfront
from os import environ
from aws_cdk.aws_apigateway import AuthorizationType


class InfrastructureStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        # ******* Database
        rehomersTable = aws_dynamodb.Table(
            self, "rehomersTable",
            partition_key=aws_dynamodb.Attribute(
                name="id",
                type=aws_dynamodb.AttributeType.STRING
            ),
            read_capacity=2,
            write_capacity=2,
            billing_mode=aws_dynamodb.BillingMode.PROVISIONED
        )

        queriesTable = aws_dynamodb.Table(
            self, "queriesTable",
            partition_key=aws_dynamodb.Attribute(
                name="id",
                type=aws_dynamodb.AttributeType.STRING
            ),
            read_capacity=2,
            write_capacity=2,
            billing_mode=aws_dynamodb.BillingMode.PROVISIONED,
            time_to_live_attribute="expires"
        )

        horsesTable = aws_dynamodb.Table(
            self, "horsesTable",
            partition_key=aws_dynamodb.Attribute(
                name="id",
                type=aws_dynamodb.AttributeType.STRING
            ),
            read_capacity=2,
            write_capacity=2,
            billing_mode=aws_dynamodb.BillingMode.PROVISIONED
        )
        volunteersTable = aws_dynamodb.Table(
            self, "volunteersTable",
            partition_key=aws_dynamodb.Attribute(
                name="id",
                type=aws_dynamodb.AttributeType.STRING
            ),
            read_capacity=2,
            write_capacity=2,
            billing_mode=aws_dynamodb.BillingMode.PROVISIONED
        )

        # ******* Lambdas and API gateway
        # Create simple, publically available API gateway resource. The CORS stuff is only for preflight requests
        rescue_centre_api = aws_apigateway.RestApi(self, 'rescueCentreAPI', rest_api_name='rescueCentreAPI',
                                                   default_cors_preflight_options={
                                                       "allow_origins": ["*"],
                                                       "allow_methods": ["GET", "POST", "OPTIONS"]
                                                   })

        auth = aws_apigateway.CfnAuthorizer(self, "adminSectionAuth", rest_api_id=rescue_centre_api.rest_api_id,
                                            type='COGNITO_USER_POOLS', identity_source='method.request.header.Authorization',
                                            provider_arns=[
                                                'arn:aws:cognito-idp:eu-west-2:040684591284:userpool/eu-west-2_3T4vtfKJE'],
                                            name="adminSectionAuth"
                                            )
        # ******* Public API
        # Create URL paths
        rehomers_resource = rescue_centre_api.root.add_resource('rehomers')
        horses_resource = rescue_centre_api.root.add_resource('horses')
        queries_resource = rescue_centre_api.root.add_resource('queries')
        volunteers_resource = rescue_centre_api.root.add_resource('volunteers')

        rehomers_lambda_function = aws_lambda.Function(self, "rehomerApplicationLambda",
                                                       handler='app.lambda_handler',
                                                       runtime=aws_lambda.Runtime.PYTHON_3_8,
                                                       code=aws_lambda.Code.from_asset(
                                                           "lambdas/rehomerApplicationLambda"),
                                                       )

        horses_lambda_function = aws_lambda.Function(self, "getHorsesLambda",
                                                     handler='app.lambda_handler',
                                                     runtime=aws_lambda.Runtime.PYTHON_3_8,
                                                     code=aws_lambda.Code.from_asset(
                                                         "lambdas/getLambda"),
                                                     )

        queries_lambda_function = aws_lambda.Function(self, "submitQueryLambda",
                                                      handler='app.lambda_handler',
                                                      runtime=aws_lambda.Runtime.PYTHON_3_8,
                                                      code=aws_lambda.Code.from_asset(
                                                          "lambdas/submitQueryLambda"),
                                                      )
        volunteers_lambda_function = aws_lambda.Function(self, "volunteerAppplicationLambda",
                                                         handler='app.lambda_handler',
                                                         runtime=aws_lambda.Runtime.PYTHON_3_8,
                                                         code=aws_lambda.Code.from_asset(
                                                             "lambdas/volunteerAppplicationLambda"),
                                                         )
        # Make intergrations
        rehomers_lambda_integration = aws_apigateway.LambdaIntegration(
            rehomers_lambda_function, proxy=True)
        rehomers_resource.add_method('POST', rehomers_lambda_integration)
        horses_lambda_integration = aws_apigateway.LambdaIntegration(
            horses_lambda_function, proxy=True)
        horses_resource.add_method('GET', horses_lambda_integration)
        queries_lambda_integration = aws_apigateway.LambdaIntegration(
            queries_lambda_function, proxy=True)
        queries_resource.add_method('POST', queries_lambda_integration)
        volunteers_lambda_integration = aws_apigateway.LambdaIntegration(
            volunteers_lambda_function, proxy=True)
        volunteers_resource.add_method('POST', volunteers_lambda_integration)

        # ******* environment variables
        rehomers_lambda_function.add_environment(
            "TABLE_NAME", rehomersTable.table_name)
        horses_lambda_function.add_environment(
            "TABLE_NAME", horsesTable.table_name)
        queries_lambda_function.add_environment(
            "TABLE_NAME", queriesTable.table_name)
        volunteers_lambda_function.add_environment(
            "TABLE_NAME", volunteersTable.table_name)

        # ******* function permissions
        rehomersTable.grant_write_data(rehomers_lambda_function)
        horsesTable.grant_read_data(horses_lambda_function)
        queriesTable.grant_write_data(queries_lambda_function)
        volunteersTable.grant_write_data(volunteers_lambda_function)

        get_rehomers_lambda_function = aws_lambda.Function(self, "getrehomersLambda",
                                                           handler='app.lambda_handler',
                                                           runtime=aws_lambda.Runtime.PYTHON_3_8,
                                                           code=aws_lambda.Code.from_asset(
                                                               "lambdas/getLambda"),)

        get_queries_lambda_function = aws_lambda.Function(self, "getQueriesLambda",
                                                          handler='app.lambda_handler',
                                                          runtime=aws_lambda.Runtime.PYTHON_3_8,
                                                          code=aws_lambda.Code.from_asset(
                                                              "lambdas/getLambda")
                                                          )
        get_volunteers_lambda_function = aws_lambda.Function(self, "getVolunteersLambda",
                                                             handler='app.lambda_handler',
                                                             runtime=aws_lambda.Runtime.PYTHON_3_8,
                                                             code=aws_lambda.Code.from_asset(
                                                                 "lambdas/getLambda"),
                                                             )

        # Make intergrations
        get_rehomers_lambda_integration = aws_apigateway.LambdaIntegration(
            get_rehomers_lambda_function, proxy=True)
        rehomers_resource.add_method('GET', rehomers_lambda_integration,
                                     authorization_type=AuthorizationType.COGNITO,
                                     authorization_scopes=["openid", "profile", "email"], authorizer=auth)
        get_queries_lambda_integration = aws_apigateway.LambdaIntegration(
            get_queries_lambda_function, proxy=True)
        queries_resource.add_method('GET', queries_lambda_integration,
                                    authorization_type=AuthorizationType.COGNITO,
                                    authorization_scopes=["openid", "profile", "email"], authorizer=auth)
        get_volunteers_lambda_integration = aws_apigateway.LambdaIntegration(
            get_volunteers_lambda_function, proxy=True)
        volunteers_resource.add_method('GET', volunteers_lambda_integration,
                                       authorization_type=AuthorizationType.COGNITO,
                                       authorization_scopes=["openid", "profile", "email"], authorizer=auth)

        # ******* environment variables
        get_rehomers_lambda_function.add_environment(
            "TABLE_NAME", rehomersTable.table_name)
        get_queries_lambda_function.add_environment(
            "TABLE_NAME", queriesTable.table_name)
        get_volunteers_lambda_function.add_environment(
            "TABLE_NAME", volunteersTable.table_name)
        get_rehomers_lambda_function.add_environment(
            "ShouldBeAuth", "true")
        get_queries_lambda_function.add_environment(
            "ShouldBeAuth", "true")
        get_volunteers_lambda_function.add_environment(
            "ShouldBeAuth", "true")

        # ******* function permissions
        rehomersTable.grant_read_data(rehomers_lambda_function)
        queriesTable.grant_read_data(queries_lambda_function)
        volunteersTable.grant_read_data(volunteers_lambda_function)

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
