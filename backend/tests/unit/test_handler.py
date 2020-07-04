import simplejson as json
import pytest
from sys import path
path.append("../../")
from os import environ
from lambdas.rehomerApplicationLambda import app 
from decimal import Decimal

def test_make_rehoming_application():
    ret = app.lambda_handler(json.load(open("../../events/rehomingApplicationEvent.json")), "")
    data = json.loads(ret["body"])
    print(data)
    assert data["success"] == True
    assert data["rehomingApplicationId"].startswith("FullName:")

if __name__ == "__main__":
    environ['APP_STAGE'] = "local"
    pytest.main()