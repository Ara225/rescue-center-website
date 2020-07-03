Rehomer Registration Flow
Views horse page >> Clicks apply to rehome >> Form for rehoming >>
Submit >> API call >> Details entered into DB >> email sent to us >>
Customer receives thank you and ref no on screen 

Checkboxes
I am over 18yrs and confirm I am the person named in this form.
I am offering a rescue pony from the charity a permanent home and will not advertise for resale. I will meet all welfare needs of the equine and contact the charity if I am ever in need of help or my circumstances should change.
I understand the charity reserve the right to sieze the rescue pony if there are concerns about welfare, dealing or breeding.
If I rehome a colt too young for castration I agree to have him castrated as soon as he is ready.
+ GPDR checkboxes

* id - Name colon then random ID - STRING NOT NULL
* name - Name of customer  - STRING NOT NULL
* emails - Email provided - STRING POSSIBLE NULL
* numbers - Phone numbers - map NOT NULL
* address - Customer address - STRING NOT NULL
* horseAddress - Address of where customer intends to keep horse at - STRING NOT NULL
* horseAddressType - owned rental or livery  - STRING NOT NULL
* farrierDetails - Address/Name/Number - STRING NOT NULL
* vetDetails - Address/Name/Number - STRING NOT NULL
* horsesTypesInterestedIn -  - ARRAY NOT NULL
* horsesInterestedIn - Name of horses other details - String POSSIBLE NULL
* preferredHeightRange 
* preferredAgeRange 
* accepted - Have we accepted them - bool/null
* internalNotes - blah whatever - STRING NOT NULL
* experience - experience with horses & whether a current horse owner - STRING NOT NULL
* date - date query submitted
* notes - Free text field  - STRING NOT NULL
* horse - if we've accepted them this is the name of the horse they've got 

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