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
    
    # This allows the function to run locally by sending requests to a local DynamoDB.
    if 'local' == os.environ.get('APP_STAGE'):
        dynamodb = boto3.resource(
            'dynamodb', endpoint_url='http://localhost:8000')
        table = dynamodb.Table("rehomersTable")
    else:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ["TABLE_NAME"])

    try:
        body = json.loads(event["body"].replace("'", '"'))
        # Prevent unauthenticated users from overwriting data
        if body.get("id") and not event['requestContext'].get("authorizer"):
            print(event)
            return getResponse(json.dumps({"success": False,"error": "Unable to update item without authentication"}), 403)
        if os.environ.get("requiresAuth") and not event['requestContext'].get("authorizer"):
            print(event)
            return getResponse(json.dumps({"success": False,"error": "Authentication required"}), 403)
        # Use the validation dict to ensure the submitted object has all the properities a object of this type should have 
        item = {}
        resource = event['resource'].replace("/", "")
        for i in validation[resource]["required"]:
            item[i] = body[i]
        for i in validation[resource]["other"]:
            item[i] = validation[resource]["other"][i]
        if body.get("id"):
            item["id"] = body["id"]
    except KeyError as e:
        print(event)
        print(e)
        return getResponse(json.dumps({"success": False,"error": "The form field " + str(e) + " was not present in the request"}), 500)
    except Exception as e:
        print(event)
        print(e)
        return getResponse(json.dumps({"success": False,"error": str(e)}), 500)
    try:
        response = table.put_item(
            Item=item
        )
    except Exception as e:
        print(event)
        print(e)
        return getResponse(json.dumps({"success": False,"error": "Error inserting record into database " + str(e)}), 500)
    print("The item " + item["id"] + " was successfully created by a request to " + event['resource'])
    return getResponse(json.dumps({"success": True, "id": item["id"]}), 200)

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