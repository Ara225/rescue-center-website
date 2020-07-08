var cognitoURL = "https://leighrescuecentre.auth.eu-west-2.amazoncognito.com/login?response_type=token&client_id=5id64a9o4k4bcq0r9mk8s7r3op&redirect_uri="
var APIEndpoint = "https://8zmmemwsei.execute-api.eu-west-2.amazonaws.com/prod/"
var horsesTableName = "backend-horsesTable42466579-1FGBM9HKLZ8EN"
var horseBucketName = "backend-websitebucket74b0f9e5-gayttyln7n1k"
var horseHeader = '<header class="w3-container w3-center">' +
                  '    <div ><span class="w3-xxlarge w3-hide-small w3-border-teal w3-bottombar">Horses</span></div>' +
                  '    <div ><span class="w3-xlarge w3-border-teal w3-bottombar w3-hide-large w3-hide-medium">Horses</span></div>' +
                  '<br><button class="w3-button w3-large w3-white" onclick="includeHTML(\'./create-horse.html\')"><i class="fa fa-plus" aria-hidden="true"></i>  Create Horse</button>' +
                  '<br><br></header>';
var applicationsHeader = '<header class="w3-container w3-center">' +
                  '    <div ><span class="w3-xxlarge w3-hide-small w3-border-teal w3-bottombar">Rehoming Applications</span></div>' +
                  '    <div ><span class="w3-xlarge w3-border-teal w3-bottombar w3-hide-large w3-hide-medium">Rehoming Applications</span></div>' +
                  '<br></header>';
var rehomersTableName = "backend-rehomersTableD4C9D2D2-105O7HRLGKHFP"
var queriesHeader = '<header class="w3-container w3-center">' +
                  '    <div ><span class="w3-xxlarge w3-hide-small w3-border-teal w3-bottombar">Queries</span></div>' +
                  '    <div ><span class="w3-xlarge w3-border-teal w3-bottombar w3-hide-large w3-hide-medium">Queries</span></div>' +
                  '<br></header>';
var queriesTableName = "backend-queriesTableC1676847-1979E9M3LCZH6"