function getCredsUnAuth(callback) {
    if (AWS.config.credentials.expired) {
        console.log("Unsuccessful auth")

    }
    else {
        console.log("Successful auth")
        scanData(horsesTableName, false)
    }
}
function getCognitoCreds(callback, withAuth) {
    AWS.config.region = 'eu-west-2';
    if (!withAuth) {
        // Configure the credentials provider to use your identity pool
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: 'eu-west-2:62a15244-4f5a-4f12-b9e6-cb87ce7b5806'
        });
    }
    else {
        if (document.location.hash && document.location.hash.search('id_token') != -1) {
            // Configure the credentials provider to use your identity pool
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: 'eu-west-2:62a15244-4f5a-4f12-b9e6-cb87ce7b5806',
                Logins: { "cognito-idp.eu-west-2.amazonaws.com/eu-west-2_3T4vtfKJE": document.location.hash.split('id_token=')[1].split('&access_token=')[0] }
            });
        }
        else {
            redirect()
        }
    }
    AWS.config.credentials.get(callback);
}
function getCredsAuth() {
    if (AWS.config.credentials.expired) {
        redirect()
    }
    else {
        console.log("Successful auth")
        setTimeout(function () {
            if (confirm("Your credentials will expire in two minutes. Would you like to re-login now? ")) {
                document.body.innerHTML = '<h2 class="w3-center">Login Required</h2><p  class="w3-center">If not redirected, please click <a href="' +
                    cognitoURL + document.location.href.split("?")[0].replace("index.html", "") + '">here</a> to go to the login page</p>'
                window.location.href = cognitoURL + document.location.href.split("#")[0].replace("index.html", "");
            }
        }, 3480000);
    }
}

