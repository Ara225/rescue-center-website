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
* id
* message
* name 
* email
* volunteerReason

Horses DB schema
* id
* age
* breed
* sex
* description
* rehomingFee

Remove data

Admin page