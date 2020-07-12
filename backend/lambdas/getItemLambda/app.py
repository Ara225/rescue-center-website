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

        #api-gateway-simple-proxy-for-lambda-input-format
        Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html

    context: object, required
        Lambda Context runtime methods and attributes

        Context doc: https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html

    Returns
    ------
    API Gateway Lambda Proxy Output Format: dict

        Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    """
    try:
        print(event["headers"])
        print(event['requestContext'])
        # This allows the function to run locally by sending requests to a local DynamoDB.
        if 'local' == os.environ.get('APP_STAGE'):
            dynamodb = boto3.resource(
                'dynamodb', endpoint_url='http://localhost:8000')
            table = dynamodb.Table("horsesTable")
        else:
            dynamodb = boto3.resource('dynamodb')
            table = dynamodb.Table(os.environ["TABLE_NAME"])
        # This is a backup to the API GW auth. It prevents the function being invoked without authentication if it shouldn't be
        if os.environ.get("requiresAuth") and not event['requestContext'].get("authorizer"):
            print(event)
            return getResponse(json.dumps({"success": False, "error": "Authentication required"}), 403)
    except Exception as e:
        return getResponse(json.dumps({"success": False, "error": str(e)}), 500)
    # Handle request for individual item
    if event.get("queryStringParameters"):
        if event["queryStringParameters"].get("id"):
            try:
                response = table.query(
                    KeyConditionExpression=Key('id').eq(
                        event["queryStringParameters"]["id"])
                )
                if response['Items'] == []:
                   return getResponse(json.dumps({"success": False, "error": "Database query returned an empty body. If an ID was supplied, this means there was no matching item"}), 500)
                else:
                    print("The item " + response['Items'][0]["id"] + " was successfully retrieved by a request to " + event['resource'])
                    return getResponse(json.dumps({"success": True, "items": response['Items']}), 200)
            except BaseException as e:
                print(e)
                return getResponse(json.dumps({"success": False, "error": "Unable to retrieve items"}), 500)
    # Handle multiple item requests
    try:
        response = None
        # Large requests are truncated by the DB. The continueKey param provides a way for the client-side code to get the next keys
        # Limit simply limits the amount of keys. This can be used to only retrieve the amount of items we need, so these work together
        # to minmize DB load
        if event.get("queryStringParameters"):
            print(event["queryStringParameters"])
            if event["queryStringParameters"].get("continueKey") and event["queryStringParameters"].get("limit"):
                response = table.scan(ExclusiveStartKey={"id": event["queryStringParameters"]["continueKey"]}, Limit=int(
                    event["queryStringParameters"]["limit"]))
            elif event["queryStringParameters"].get("continueKey"):
                response = table.scan(
                    ExclusiveStartKey={"id": event["queryStringParameters"]["continueKey"]})
            elif event["queryStringParameters"].get("limit"):
                response = table.scan(
                    Limit=int(event["queryStringParameters"]["limit"]))
            else:
                response = table.scan()
        else:
            response = table.scan()
        if response['Items'] == []:
            return getResponse(json.dumps({
                        "success": False,
                        "error": "Database query returned an empty body. If an ID was supplied, this means there was no matching item"
                    }), 500)
        # If a last evaluated key is provided, we return this so the client app can use it to get the next items later
        if response.get("LastEvaluatedKey"):
            key = response["LastEvaluatedKey"]['id']
        else:
            key = None
        print("The items " + str([i["id"] for i in response['Items']]) + " were successfully retrieved by a request to " + event['resource'])
        return getResponse(json.dumps({"success": True,"items": response['Items'],"count": response['Count'],"continueKey": key}), 200)
    except BaseException as e:
        print(e)
        return getResponse(json.dumps({"success": False, "error": "Unable to retrieve items" }), 500)

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
