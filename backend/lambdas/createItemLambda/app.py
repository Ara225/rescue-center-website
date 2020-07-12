import simplejson as json
import boto3
import os
import random
import string
from datetime import datetime, timedelta
from decimal import Decimal
randomString = ''.join([random.choice(string.ascii_letters
                                      + string.digits) for n in range(32)])
validation = {
    "rehomers": {"required": ["Name", "EmailAddress", "PrimaryPhoneNumber", "SecondaryPhoneNumber", "HomeAddress", "AgeRange", 
                             "HeightRange", "OtherHorseDetails", "HorseAddress", "HorseAddressType", "FarrierDetails", 
                             "VetDetails", "experience", "notes", "preferredSex", "preferredSuitableFor", "OtherRefreeDetails"],
                "other": { "id": randomString, "date": Decimal(datetime.now().timestamp()), "accepted": "N/A", "internalNotes": ""}
                },
    "queries": {"required": ["Name", "EmailAddress","Message"],
                "other": {"id":  randomString, "date": Decimal(datetime.now().timestamp()), "expires": Decimal((datetime.now() + 
                timedelta(days=30)).timestamp())}
               },
    "volunteers": {"required": ["Name", "EmailAddress", "PhoneNumber", "volunteerWhy", "volunteerExperience", "volunteerTransport"],
                   "other": {"id": randomString, "date": Decimal(datetime.now().timestamp())}
                  },
    "horses": {"required": ['Name', 'Age', 'Breed', 'Sex', 'SuitableFor', 'Height', 'Description', 'RehomingFee', 'images', 'videos'],
               "other": {"id": randomString, "date": Decimal(datetime.now().timestamp())}
              }
                  
}


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
    print(event["headers"])
    print(event['requestContext'])
    
    # This allows the function to run locally by sending requests to a local DynamoDB.
    if 'local' == os.environ.get('APP_STAGE'):
        dynamodb = boto3.resource(
            'dynamodb', endpoint_url='http://localhost:8000')
        table = dynamodb.Table("rehomersTable")
    else:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ["TABLE_NAME"])

    try:
        # Prevent unauthenticated users from overwriting data
        if body.get("id") and not event['requestContext'].get("authorizer"):
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
                    "error": "Unable to update item without authentication"
                }),
            }
        if os.environ.get("requiresAuth") and not event['requestContext'].get("authorizer"):
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
        item = {}
        for i in validation[event['resource']]["required"]:
            item[i] = body[i]
        for i in validation[event['resource']]["other"]:
            item[i] = validation[event['resource']]["other"][i]
        if body.get("id"):
            item["id"] = body[id]
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
            Item=item
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
                "error": "Error inserting record into database " + str(e)
            }),
        }
    print("The item " + item["id"] + " was successfully created by a request to " + event['resource'])
    return {
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        "statusCode": 200,
        "body": json.dumps({
            "success": True,
            "id": item["id"]
        }),
    }
