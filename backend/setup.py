import setuptools


with open("README.md") as fp:
    long_description = fp.read()


setuptools.setup(
    name="LeighRescueCentreInfrastructure",
    version="1.0.0",

    description="Leigh Rescue Centre Infrastructure",
    long_description=long_description,
    long_description_content_type="text/markdown",

    author="author",

    package_dir={"": "infrastructure"},
    packages=setuptools.find_packages(where="infrastructure"),

    install_requires=[
        "aws-cdk.core==1.45.0",
        "aws-cdk.aws_apigateway",
        "aws-cdk.aws_lambda",
        "aws-cdk.aws_s3",
        "aws-cdk.aws_dynamodb",
        "aws-cdk.aws_s3_deployment",
        "aws-cdk.aws_cloudfront",
        "aws-cdk.aws_sns",
        "aws-cdk.aws_sns_subscriptions"
    ],


    python_requires=">=3.6",

    classifiers=[
        "Development Status :: 4 - Beta",

        "Intended Audience :: Developers",

        "License :: OSI Approved :: Apache Software License",

        "Programming Language :: JavaScript",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",

        "Topic :: Software Development :: Code Generators",
        "Topic :: Utilities",

        "Typing :: Typed",
    ],
)
