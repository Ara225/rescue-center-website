import simplejson as json
import boto3
import os
import random
import string
from datetime import datetime, timedelta
from decimal import Decimal
from requests import post

def lambda_handler(event, context):
    """
    Creates an item in a the DynamoDB table. Uses the validation dicts above to valdate the input.
    args:
        event: (dict), required
            API Gateway Lambda Proxy Input Format
    
            Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
    
        context: (object), required
            Lambda Context runtime methods and attributes
    
            Context doc: https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html
    
    Returns:
    API Gateway Lambda Proxy Output Format: dict

        Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    """
    # A random string used as an ID for the item in the DB
    randomString = ''.join([random.choice(string.ascii_letters
                                      + string.digits) for n in range(32)])
    
    # Dictionaries for validating the body of the request
    # The top-level keys are the name of the API endpoints. The required key in the inner dict is a list of the
    # required keys in the request body, and the other key is a list of keys to add to the item in the DB
    validation = {
        "rehomers": {"required": ["Name", "EmailAddress", "PrimaryPhoneNumber", "SecondaryPhoneNumber", "HomeAddress", "AgeRange",
                                  "HeightRange", "OtherHorseDetails", "HorseAddress", "HorseAddressType", "FarrierDetails",
                                  "VetDetails", "experience", "notes", "preferredSex", "preferredSuitableFor", "OtherRefreeDetails"],
                     "other": {"id": randomString, "date": Decimal(datetime.now().timestamp()), "accepted": "N/A", "internalNotes": ""}
                     },
        "queries": {"required": ["Name", "EmailAddress", "Message"],
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
    # Log the request headers and authorization context
    print(event["headers"])
    print(event['requestContext'])
    # Setup the connection to the DynamoDB table. Allows the function to run locally by sending requests to a local DynamoDB.
    if 'local' == os.environ.get('APP_STAGE'):
        dynamodb = boto3.resource(
            'dynamodb', endpoint_url='http://localhost:8000')
        table = dynamodb.Table("rescueCentreTable")
    else:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ["TABLE_NAME"])
    try:
        resource = event['resource'].replace("/", "")
        # If we're dealing with a public facing form and aren't running locally, call checkReCaptcha which uses ReCaptcha to 
        # check that the user isn't a bot
        if not os.environ.get("requiresAuth") and os.environ.get('APP_STAGE') != 'local':
            result = checkReCaptcha(event, resource)
            if result:
                return result
        # Parse the request body
        body = json.loads(event["body"].replace("'", '"'))
        # This function is used for updating and creating items, so this checks to make sure that the user isn't trying to 
        # update (i.e. overwrite a item) when they're unauthenticated
        if body.get("id") and not event['requestContext'].get("authorizer"):
            print(event)
            return getResponse(json.dumps({"success": False, "error": "Unable to update item without authentication"}), 403, resource)
        # Backup in case the API gateway's auth doesn't work - requestContext is injected by the API gateway so the user can't maniplate it
        if os.environ.get("requiresAuth") and not event['requestContext'].get("authorizer"):
            print(event)
            return getResponse(json.dumps({"success": False, "error": "Authentication required"}), 403, resource)
        # Use the validation dict to ensure the submitted object has all the properities a object of being sent to this endpoint should have
        item = {}
        for i in validation[resource]["required"]:
            item[i] = body[i]
        for i in validation[resource]["other"]:
            item[i] = validation[resource]["other"][i]
        # This turns the action into a update (DynamoDB allows the put method to update as well)
        if body.get("id"):
            item["id"] = body["id"]
    except KeyError as e:
        print(event)
        print(e)
        return getResponse(json.dumps({"success": False, "error": "The form field " + str(e) + " was not present in the request"}), 500, resource)
    except Exception as e:
        print(event)
        print(e)
        return getResponse(json.dumps({"success": False, "error": str(e)}), 500, resource)
    # Insert item into the database
    try:
        response = table.put_item(
            Item=item
        )
    except Exception as e:
        print(event)
        print(e)
        return getResponse(json.dumps({"success": False, "error": "Error inserting record into database " + str(e)}), 500, resource)
    # Log success
    print("The item " + item["id"] +
          " was successfully created by a request to " + event['resource'])
    return getResponse(json.dumps({"success": True, "id": item["id"]}), 200, resource)


def getResponse(body, statusCode, resource=None):
    """    
    Returns the dict the function needs to return. Prevents cluttering code with massive amounts of dicts.
    Also handles sending SNS notifications.

    Args:
        body (dict): Dictionary to return in the body of the result
        statusCode (int): HTTP status code
        resource (str, optional): The name of the resource (HTTP endpoint). Defaults to None.

    Returns:
        API Gateway Lambda Proxy Output Format: (dict)
        Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    """
    try:
        if os.environ.get("TOPIC_ARN") and not os.environ.get("requiresAuth") and os.environ.get('APP_STAGE') != 'local':
            client = boto3.client('sns')
            if resource:
                message = " The " + resource + " form was submitted. "
            if json.loads(body)["success"]:
                message += 'The form submission was successful. The item ID was ' + \
                    json.loads(body)[
                        "id"] + ' You can login to www.leighrescuecentre.co.uk/admin for details'
            else:
                message += 'The form submission failed. The status code was ' + \
                    str(statusCode)
            # Publish to the SNS topic - this results in email notifications being sent
            response = client.publish(
                TopicArn=os.environ["TOPIC_ARN"],
                Message=message,
                Subject='Form submission - Leigh Rescue Centre Website'
            )
    except Exception as e:
        print("Error while publishing to SNS topic")
        print(e)
    return {
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE'
        },
        "statusCode": statusCode,
        "body": body
    }


def checkReCaptcha(event, resource):
    """ 
    Check that ReCaptcha thinks that the user is a human. Site uses Recaptcha V3 (invisible) initially and
    ReCaptcha V2 to doublecheck if Google thinks we're dealing with a bot.
    Args:
        event (dict): The dictionary describing the event
        resource (str): The resource (API endpoint) name

    Returns:
        dict || None: Dict to return if we can't validate the ReCaptcha key or Google thinks the user is a bot,
        nothing otherwise.
    """
    if not event["queryStringParameters"]:
        return getResponse(json.dumps({"success": False, "message": "No reCaptcha key provided"}), 500, resource)
    elif not event["queryStringParameters"].get("token"):
        return getResponse(json.dumps({"success": False, "message": "No reCaptcha key provided"}), 500, resource)
    else:
        if event["queryStringParameters"].get("isV2"):
            secret = open("keyV2.txt").read().replace(
                "\r\n", "").replace("\n", "")
        else:
            secret = open("keyV3.txt").read().replace(
                "\r\n", "").replace("\n", "")
        responseFromGoogle = post("https://www.google.com/recaptcha/api/siteverify", {"secret": secret,
                                                                                      "response": event["queryStringParameters"]["token"]})
        
        # Fallback - failure should be indicated by success being False not a HTTP error
        if responseFromGoogle.status_code != 200:
            print(responseFromGoogle.json())
            print("ReCaptcha validation request failed")
            return getResponse(json.dumps({"success": False, "Error": "ReCaptcha validation failed"}), 500, resource)
        # If Google was unable to verify the key we sent
        elif responseFromGoogle.json()["success"] == False:
            print(responseFromGoogle.json())
            print("ReCaptcha validation failed")
            return getResponse(json.dumps({"success": False, "Error": "ReCaptcha validation failed.",
                                           "error-codes": responseFromGoogle.json().get("error-codes", [])
                                           }), 500, resource)
        # Score is specific to ReCaptcha V3, it indicates the confidence that the user is not a bot
        elif responseFromGoogle.json().get("score"):
            if responseFromGoogle.json()["score"] < 0.5:
                print("ReCaptcha test failed (score under threshold)")
                return getResponse(json.dumps({"success": False, "message": "Score below threshold"}), 200, resource)
