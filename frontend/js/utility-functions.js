function getCredsUnAuth(callback) {
    if (AWS.config.credentials.expired) {
        console.log("Unsuccessful auth")
        // If we come here from /admin, auth doesn't work properly unless the page is reloaded, so this is a work around.
        // Assume the AWS stuff is being cached
        window.location.reload(true)
    }
    else {
        console.log("Successful auth")
        if (callback) {
            callback()
        }
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
        if ((document.location.hash && document.location.hash.search('id_token') != -1) || window.sessionStorage.id_token) {
            // Configure the credentials provider to use your identity pool
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: 'eu-west-2:62a15244-4f5a-4f12-b9e6-cb87ce7b5806',
                Logins: { "cognito-idp.eu-west-2.amazonaws.com/eu-west-2_3T4vtfKJE": 
                document.location.hash ?
                document.location.hash.split('id_token=')[1].split('&access_token=')[0] :
                window.sessionStorage.id_token }
            });
        }
        else {
            redirect()
        }
    }
    AWS.config.credentials.get(callback);
}
function getCredsAuth(callback) {
    if (AWS.config.credentials.expired) {
        redirect()
    }
    else {
        window.sessionStorage.id_token = document.location.hash ?
        document.location.hash.split('id_token=')[1].split('&access_token=')[0] :
        window.sessionStorage.id_token
        console.log("Successful auth")
        setTimeout(function () {
            if (confirm("Your credentials will expire in two minutes. Would you like to re-login now? ")) {
                document.body.innerHTML = '<h2 class="w3-center">Login Required</h2><p  class="w3-center">If not redirected, please click <a href="' +
                    cognitoURL + document.location.href.split("?")[0].replace("index.html", "") + '">here</a> to go to the login page</p>'
                window.location.href = cognitoURL + document.location.href.split("#")[0].replace("index.html", "");
            }
        }, 3480000);
        if (callback) {
            callback()
        }
    }
}


// Modal Image Gallery
function onClick(element) {
    document.getElementById("img01").src = element.src;
    document.getElementById("modal01").style.display = "block";
    var captionText = document.getElementById("caption");
    captionText.innerHTML = element.alt;
}

function w3_open() {
    var mySidebar = document.getElementById("mySidebar");
    if (mySidebar.style.display === 'block') {
        mySidebar.style.display = 'none';
    } else {
        mySidebar.style.display = 'block';
    }
}

// Close the sidebar with the close button
function w3_close() {
    var mySidebar = document.getElementById("mySidebar");
    mySidebar.style.display = "none";
}

/**
 * Convert form to a JSON object
*/
function formToJSON(form) {
    console.log(form)
    console.log(form.length)
    var data = {}
    for (var i = 0; i < form.length; i++) {
        console.log(form[i].id)
        // This allows skipping fields
        if (form[i].id == "") {
            continue
        }
        else {
            if (form[i].value == "" && form[i].required) {
                document.getElementById("submit").innerText = 'Submit'
                alert("Unable to validate form. Please ensure all required fields are completed")
                return false;
            }
            else {
                data[form[i].id] = form[i].value;
                console.log(data)
            }
        }
    }
    return data;
}
function onRehomerFormSubmit(token) {
    document.getElementById("submit").innerHTML = 'Submitting <i class="fa fa-spinner fa-spin"></i>'
    try {
        var horseTypeCheckBoxGroup = document.getElementsByClassName('FormFieldGroup')
        var oneChecked = false
        for (i in horseTypeCheckBoxGroup) {
            if (horseTypeCheckBoxGroup[i].checked) {
                oneChecked = true
            }
        }
        if (!oneChecked) {
            document.getElementById("submit").innerText = 'Submit'
            alert("Please tick a box in the \"I'm interested in a\" section")
            return false;
        }
        var form = formToJSON(document.getElementsByClassName('FormField'));
        form.HorsePreferences = []
        var HorsePreferences = document.getElementsByClassName('HorsePreferences')
        for (i in HorsePreferences) {
            if (HorsePreferences[i].checked) {
                form.HorsePreferences.push(HorsePreferences[i].id)
            }
        }
        fetch(APIEndpoint + "rehomers", {
                  method: "POST", 
                  body: JSON.stringify(form)
                }).then(res => { console.log(res);
                  res.json().then(jsonResult => {console.log(jsonResult);displayResult(jsonResult)})
                });
    }
    catch(e) {
        displayError(e.message)
    }
}

function onContactFormSubmit(token) {
    try {
        document.getElementById("submit").innerHTML = 'Submitting <i class="fa fa-spinner fa-spin"></i>'
        var form = formToJSON(document.getElementsByClassName('FormField'));
        fetch(APIEndpoint + "queries", {
                  method: "POST", 
                  body: JSON.stringify(form)
                }).then(res => { 
                  res.json().then(jsonResult => {displayResult(jsonResult)}).catch(e => displayError(e.message))
                }).catch(e => displayError(e.message));
    }
    catch(e) {
        displayError(e.message)
    }
}

function displayResult(result) {
    if (result.success) {
        displaySuccess("  <p>Thanks for your query. Your reference is: " + result.id + "</p>" +
                       "  <p>We'll try to get back to you within seven working days.</p>")
    }
    else if (!result.success) {
        displayError(result.error)
    }
}

function displaySuccess(text) {
    document.getElementById("alertDiv").innerHTML = "<header class=\"w3-container w3-teal\"> " +
                                                    "  <span onclick=\"document.getElementById('alertBox').style.display='none'\" " +
                                                    "  class=\"w3-button w3-display-topright\">&times;</span>" +
                                                    "  <h2>Form Submitted Successfully</h2>" +
                                                    "</header>" +
                                                    "<div class=\"w3-container\">" +
                                                    text +
                                                    "</div>" 
    document.getElementById("submit").innerText = 'Submit'
    document.getElementById('alertBox').style.display='block'
    document.getElementById("Form").reset()
}

function displayError(e) {
    console.log(e)
    document.getElementById("submit").innerText = 'Submit'
    document.getElementById("alertDiv").innerHTML = "<header class=\"w3-container w3-red\"> " +
                                                    "  <span onclick=\"document.getElementById('alertBox').style.display='none'\" " +
                                                    "  class=\"w3-button w3-display-topright\">&times;</span>" +
                                                    "  <h2>Form submission failed</h2>" +
                                                    "</header>" +
                                                    "<div class=\"w3-container\">" +
                                                    "  <p>Form submission failed due to the following error: " + e + "</p>" +
                                                    "  <p>Please ensure that you're connected to the internet, and reach " +
                                                    "out to us if the behaviour continues</p>" +
                                                    "</div>" 
    document.getElementById('alertBox').style.display='block'
}
