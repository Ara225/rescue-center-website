import simplejson as json
import boto3
import os
import random
import string
from datetime import datetime, timedelta
from decimal import Decimal
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    """
    Get either all items, a specified number of items or a specific poll. See README.md for more

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
    # This allows the function to run locally by sending requests to a local DynamoDB. Option one is for when it's
    #  being run by SAM, option two for when the tests are being run, and three for production
    print(event["headers"])
    print(event['requestContext'])
    if 'local' == os.environ.get('APP_STAGE'):
        dynamodb = boto3.resource('dynamodb', endpoint_url='http://localhost:8000')
        table = dynamodb.Table("horsesTable")
    else:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ["TABLE_NAME"])
    if not event['requestContext'].get("authorizer"):
        print(event)
        return {
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            "statusCode": 403,
            "body": json.dumps({
                "success": False,
                "error": "Authentication required"
            }),
        }
    if event.get("queryStringParameters"):
        if event["queryStringParameters"].get("id"):
            try:
                response = response = table.delete_item(
                                             Key={
                                                 'id': event["queryStringParameters"]["id"]
                                             }
                                         ) 
                print(response)
                if response['Items'] == []:
                    return {
                        'headers': {
                            'Access-Control-Allow-Headers': 'Content-Type',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                        },
                        "statusCode": 500,
                            "body": json.dumps({
                                "success": False,
                                "error": "Database delete returned an empty body. If an ID was supplied, this means there was no matching item" 
                            }),
                    }
                else:
                    print("The item " + response['Items'][0]["id"] + " was successfully deleted by a request to " + event['resource'])
                    return {
                        'headers': {
                            'Access-Control-Allow-Headers': 'Content-Type',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                        },
                        "statusCode": 200,
                        "body": json.dumps({
                            "success": True,
                            "items": response['Items']
                        }),
                    }
            except BaseException as e:
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
                        "error": "Unable to delete items" 
                    }),
                }
    else:
        return {
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "error": "id is a required parmeter" 
            }),
        }