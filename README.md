Rehomer Registration Flow
Views horse page >> Clicks apply to rehome >> Form for rehoming >>
Submit >> API call >> Details entered into DB >> email sent to us >>
Customer receives thank you and ref no on screen 

Checkboxes
{
    "FullName": "d",
    "EmailAddress": "d",
    "PrimaryPhoneNumber": "d",
    "SecondaryPhoneNumber": "",
    "HomeAddress": "d",
    "AgeRange": "d",
    "HeightRange": "d",
    "OtherHorseDetails": "",
    "HorseAddress": "d",
    "HorseAddressType": "Owned",
    "FarrierDetails": "d",
    "VetDetails": "d",
    "experience": "d",
    "notes": "",
    "HorseType": [],
    "HorseUse": [
        "RidingHorse"
    ]
}
* id - Name colon then random ID - STRING NOT NULL
* date - date query submitted
* accepted - Have we accepted them - bool/null
* internalNotes - blah whatever - STRING NOT NULL

Contact Us/volunteer flow
{
            "FullName": body["FullName"],
            "EmailAddress": body["EmailAddress"],
            "Message": body["Message"],
            "QueryReason": body["QueryReason"],
            "id": body["FullName"] + ":" + randomString,
            "date": Decimal(datetime.now().timestamp()),
            "expires": Decimal(expiresIn)
        }

Horses DB schema
* id
* name
* age
* breed
* sex
* description
* uses
* rehomingFee
* images
* videos

Remove data

Admin page

## Installing Lambda packages
(Linux (inc WSL and Docker container) only)
python3 -m pip install --system -r requirements.txt -t ./