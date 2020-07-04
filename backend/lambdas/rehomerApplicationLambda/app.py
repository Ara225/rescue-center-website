import simplejson as json
import boto3
import os
import random
import string
from datetime import datetime
from decimal import Decimal
def lambda_handler(event, context):
    """
    Add a rehoming application. See README.md for more

    Parameters
    ----------
    event: dict, required
        API Gateway Lambda Proxy Input Format

        Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format

    context: object, required
        Lambda Context runtime methods and attributes

        Context doc: https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html

    Returns
    ------
    API Gateway Lambda Proxy Output Format: dict

        Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    """
    body = json.loads(event["body"].replace("'", '"'))
    # This allows the function to run locally by sending requests to a local DynamoDB.
    if 'local' == os.environ.get('APP_STAGE'):
        dynamodb = boto3.resource('dynamodb', endpoint_url='http://localhost:8000')
        table = dynamodb.Table("rehomersTable")
    else:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ["DDB_TABLE_NAME"])

    # Create unique ID for the rehomingApplication
    randomString = ''.join([random.choice(string.ascii_letters 
            + string.digits) for n in range(32)]) 
    try:
        rehomingApplication = {
            "FullName": body["FullName"],
            "EmailAddress": body["EmailAddress"],
            "PrimaryPhoneNumber": body["PrimaryPhoneNumber"],
            "SecondaryPhoneNumber": body["SecondaryPhoneNumber"],
            "HomeAddress": body["HomeAddress"],
            "AgeRange": body["AgeRange"],
            "HeightRange": body["HeightRange"],
            "OtherHorseDetails": body["OtherHorseDetails"],
            "HorseAddress": body["HorseAddress"],
            "HorseAddressType": body["HorseAddressType"],
            "FarrierDetails": body["FarrierDetails"],
            "VetDetails": body["VetDetails"],
            "experience": body["experience"],
            "notes": body["notes"],
            "HorseType": body["HorseType"],
            "HorseUse": body["HorseUse"],
            "id": body["FullName"] + ":" + randomString,
            "date": Decimal(datetime.now().timestamp()),
            "accepted": "N/A",
            "internalNotes": ""
        }
    except KeyError as e:
        print(event)
        print(e)
        return {
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "error": "The form field " + str(e) + " was not present in the request"
            }),
        }
    except Exception as e:
        print(event)
        print(e)
        return {
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "error": str(e)
            }),
        }
    try:
        response = table.put_item(
            Item=rehomingApplication
        )
    except Exception as e:
        print(event)
        print(e)
        return {
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "error": str(e)
            }),
        }
    return {
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        "statusCode": 200,
        "body": json.dumps({
            "success": True,
            "rehomingApplicationId": rehomingApplication["id"]
        }),
    }
