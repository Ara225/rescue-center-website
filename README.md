Rehomer Registration Flow
Views horse page >> Clicks apply to rehome >> Form for rehoming >>
Submit >> API call >> Details entered into DB >> email sent to us >>
Customer receives thank you and ref no on screen 

* id - Name colon then random ID - STRING NOT NULL
* name - Name of customer  - STRING NOT NULL
* emails - Emails provided - Array POSSIBLE NULL
* numbers - Phone numbers - map NOT NULL
* address - Customer address - STRING NOT NULL
* horseAddress - Address of where customer intends to keep horse at - STRING NOT NULL
* horseAddressType - owned rental or livery  - STRING NOT NULL
* horseAccommodationDetails - Free text field Customer description of type of home horse will have field stable etc - STRING NOT NULL
* farrierDetails - Address/Name - STRING NOT NULL
* vetDetails - Address/Name - STRING NOT NULL
* otherHorses - Number of other horses owned - NUMBER NOT NULL
* horsesInterestedIn - Names of horses interested in - Array POSSIBLE NULL
* typeOfHorsesInterestedIn - If we don't have a horse they want or are flexible - String POSSIBLE NULL
* primaryCarer - Name of primary carer, may be different from customer name - STRING NOT NULL
* accepted - Have we accepted them - bool/null
* internalNotes - blah - STRING NOT NULL
* customerNotes - More details, background etc - STRING NOT NULL
* expires - Timestamp for TTL when this record expires - NUMBER NOT NULL

Contact Us/volunteer flow
* id
* message
* name 
* email
* message
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