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
    Delete a Item from the DB

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
    print(event["headers"])
    print(event['requestContext'])
    if 'local' == os.environ.get('APP_STAGE'):
        dynamodb = boto3.resource('dynamodb', endpoint_url='http://localhost:8000')
        table = dynamodb.Table("rescueCentreTable")
    else:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ["TABLE_NAME"])
    # This is a backup to the API GW auth, to prevent the function being invoked without authentication. 
    if not event['requestContext'].get("authorizer"):
        print(event)
        return getResponse( json.dumps({"success": False,"error": "Authentication required"}), 403)
    
    if event.get("queryStringParameters"):
        if event["queryStringParameters"].get("id"):
            try:
                response = response = table.delete_item(
                                             Key={
                                                 'id': event["queryStringParameters"]["id"]
                                             }
                                         ) 
                print(response)
                if response.get('Items') == []:
                    return getResponse(json.dumps({"success": False, "error": "Database delete returned an empty body. If an ID was supplied, this means there was no matching item" }), 500)
                else:
                    print("The item " + response['Items'][0]["id"] + " was successfully deleted by a request to " + event['resource'])
                    return getResponse(json.dumps({"success": True, "items": response['Items']}), 200)
            except BaseException as e:
                print(e)
                return getResponse(json.dumps({"success": False,"error": "Unable to delete items" }), 500)
    else:
        return getResponse(json.dumps({"success": False,"error": "id is a required parmeter" }), 500)

def getResponse(body, statusCode):
    '''
    Returns the dict the  function needs to return. Prevents cluttering code with massive amounts of dicts 
    '''
    return {
                'headers': {
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE'
                },
                "statusCode": statusCode,
                "body": body
            }