
/**
 * This file contains logic necessary to make form submission work and display feedback to the user
 * using custom popups. It is not used for exclusively admin area stuff, i.e. the horse creation form
*/

/**
 * Parses a collection of HTML elements into JSON. Each element has it's ID as the key and the content of it's value 
 * attribute as the value. This won't result in meaningful results if the element's value attribute is not normally 
 * populated
 * @param {HTMLCollection} form Collection of objects to parse in to JSON
 */
function formToJSON(form) {
    var data = {}
    for (var i = 0; i < form.length; i++) {
        console.log(form[i].id)
        // This allows us to skip fields in the input if we need to
        if (form[i].id == "") {
            continue
        }
        else {
            if (form[i].value == "" && form[i].required) {
                document.getElementById("submit").innerText = 'Submit Form'
                document.getElementById("submit").disabled = false
                alert("Unable to validate form. Please ensure all required fields are completed")
                return false;
            }
            else {
                data[form[i].id] = form[i].value;
            }
        }
    }
    return data;
}

/**
 * Handle submission of the rehomer form. Handles both the admin and customer facing side
 * @param {String} token ReCaptcha token. If a falsy value such as false, '' or 0,  ReCaptcha validation is turned off 
 * (though if this is a customer facing form, the request will be rejected at the endpoint so no security risk)
 * @param {Boolean} isUpdate If this is a update of an existing item. This only changes the behaviour in a few small ways:
 * * Adds creds to request. Doesn't check validity 
 * * Changes method to PUT (PUT functions are authorized to update items, but only with valid credentials)
 */
async function onRehomerFormSubmit(token, isUpdate) {
    document.getElementById("submit").innerHTML = 'Submitting <i class="fa fa-spinner fa-spin"></i>'
    document.getElementById("submit").disabled = true
    try {
        // Special cases for check box groups
        var SuitableForCheckBoxGroup = document.getElementsByClassName('preferredSuitableFor')
        var oneChecked = false
        for (i in SuitableForCheckBoxGroup) {
            if (SuitableForCheckBoxGroup[i].checked) {
                oneChecked = true
            }
        }
        if (!oneChecked) {
            document.getElementById("submit").innerText = 'Submit Form'
            document.getElementById("submit").disabled = false
            alert("Please tick a box in the \"Planned horse use\" section")
            return false;
        }
        var SexCheckBoxGroup = document.getElementsByClassName('preferredSex')
        var oneChecked = false
        for (i in SexCheckBoxGroup) {
            if (SexCheckBoxGroup[i].checked) {
                oneChecked = true
            }
        }
        if (!oneChecked) {
            document.getElementById("submit").innerText = 'Submit Form'
            document.getElementById("submit").disabled = false
            alert("Please tick a box in the \"I'm looking for a\" section")
            return false;
        }
        var form = formToJSON(document.getElementsByClassName('FormField'));
        if (!form) {
            return
        }
        form.preferredSuitableFor = []
        var preferredSuitableFor = document.getElementsByClassName('preferredSuitableFor')
        for (i in preferredSuitableFor) {
            if (preferredSuitableFor[i].checked) {
                form.preferredSuitableFor.push(preferredSuitableFor[i].id)
            }
        }
        form.preferredSex = []
        var preferredSex = document.getElementsByClassName('preferredSex')
        for (i in preferredSex) {
            if (preferredSex[i].checked) {
                form.preferredSex.push(preferredSex[i].id)
            }
        }
        // Initialize the request object
        var details = {method: (isUpdate ? "PUT" : "POST"), body: JSON.stringify(form)}
        // If it's a update, confirm with user that that's OK, and add authorization to request 
        if (isUpdate) {
            if (!confirm("This action will edit a preexisting record. Is this OK?")) {
                return alert("Operation cancelled at user request")
            }
            details.headers = { Authorization: window.sessionStorage.id_token }
        }
        var endpoint = "rehomers"
        // Add token to request if requested
        if (token) {
            endpoint += "?token=" + token
        }
        var res = await fetch(APIEndpoint + endpoint, details)
        var jsonResult = await res.json()
        // If Google thinks the user is a bot, the endpoint will return this. We then display a Recaptcha V2
        // to verify
        if (res.status == 200 && jsonResult.message == "Score below threshold") {
            displayRecaptcha(endpoint, details)
            return
        }
        displayResult(jsonResult)
    }
    catch(e) {
        displayError(e.message)
    }
}

/**
 * Used for contact and volunteer form. Fundamentally similar to onRehomerFormSubmit.
 * @param {String} token ReCaptcha token
 * @param {String} endpoint Endpoint to call
 * @param {Boolean} isUpdate If this is a update of an existing item. This only changes the behaviour in a few small ways:
 * * Adds creds to request. Doesn't check validity 
 * * Changes method to PUT (PUT functions are authorized to update items, but only with valid credentials)
 */
async function onContactFormSubmit(token, endpoint, isUpdate) {
    try {
        var details = {method: (isUpdate ? "PUT" : "POST")}
        if (isUpdate) { 
            if (!confirm("This action will edit a preexisting record. Is this OK?")) {
                return alert("Operation cancelled at user request")
            }
            details.headers = { Authorization: window.sessionStorage.id_token }
        }
        document.getElementById("submit").innerHTML = 'Submitting <i class="fa fa-spinner fa-spin"></i>'
        document.getElementById("submit").disabled = true
        var form = formToJSON(document.getElementsByClassName('FormField'));
        if (!form) {
            return
        }
        details.body = JSON.stringify(form)
        if (token) {
            endpoint = endpoint + "?token=" + token
        }
        var res = await fetch(APIEndpoint + endpoint, details)
        var jsonResult = await res.json()
        if (res.status == 200 && jsonResult.message == "Score below threshold") {
            displayRecaptcha(endpoint, details)
            return
        }
        displayResult(jsonResult)
    }
    catch(e) {
        displayError(e.message)
    }
}

/**
 * Utility function to decide whether to show a error or success
 * @param {Object} result Object produced by a Result object's json() method
 */
function displayResult(result) {
    if (result.success) {
        displaySuccess(document.location.href.search("/admin/") != -1 ? 
        "  <p>The database was updated. The reference is: " + result.id + "</p>" :
        "  <p>Thanks for your query. Your reference is: " + result.id + "</p>" +
        "  <p>We'll try to get back to you within seven working days.</p>")
    }
    else if (!result.success) {
        displayError(result.error)
    }
}

/**
 * Display confirmation of successful form submission
 * @param {String} text Body of the popup 
 * @param {String} subject Subject of the popup (Optional)
 */
function displaySuccess(text, subject) {
    document.getElementById("alertDiv").innerHTML = "<header class=\"w3-container w3-teal\"> " +
                                                    "  <span onclick=\"document.getElementById('alertBox').style.display='none'\" " +
                                                    "  class=\"w3-button w3-display-topright\">&times;</span>" +
                                                    "  <h2>" + (subject ? subject : "Form Submitted Successfully") + "</h2>" +
                                                    "</header>" +
                                                    "<div class=\"w3-container\">" +
                                                    text +
                                                    "</div>" 
    document.getElementById('alertBox').style.display='block'
    if (document.querySelector("#submit")) {
        document.getElementById("submit").innerText = 'Submit Form'
        document.getElementById("submit").disabled = false
        document.getElementById("Form").reset()
    }
}

/**
 * Display an error
 * @param {Error | *} e Trigging error or anything else that can be printed
 * @param {String} subject Subject to be shown in the header of the popup (Optional)
 */
function displayError(e, subject) {
    console.log(e)
    document.getElementById("alertDiv").innerHTML = "<header class=\"w3-container w3-red\"> " +
                                                    "  <span onclick=\"document.getElementById('alertBox').style.display='none'\" " +
                                                    "  class=\"w3-button w3-display-topright\">&times;</span>" +
                                                    "  <h2>" + (subject ? subject : "Form submission failed") + "</h2>" +
                                                    "</header>" +
                                                    "<div class=\"w3-container\">" +
                                                    "  <p>" + (subject ? subject : "Form submission failed") + " due to the following error: " + e + "</p>" +
                                                    "  <p>Please ensure that you're connected to the internet, and reach " +
                                                    "out to us if the behaviour continues</p>" +
                                                    "</div>" 
    document.getElementById('alertBox').style.display='block'
    if (document.querySelector("#submit")) {
       document.getElementById("submit").innerText = 'Submit Form'
       document.getElementById("submit").disabled = false
    }
}

/**
 * Display a Recaptcha V2 in a popup and resubmit the request once the user has completed it
 * @param {String} endpoint API endpoint to call
 * @param {Request} details Body and headers of the request
 */
function displayRecaptcha(endpoint, details) {
    document.getElementById('alertBox').style.display='block'
            document.getElementById('alertDiv').innerHTML = "<header class=\"w3-container w3-red\"> " +
            "  <span onclick=\"document.getElementById('alertBox').style.display='none'\" " +
            "  class=\"w3-button w3-display-topright\">&times;</span>  <h2>Security Check</h2>" +
            "</header>" +
            "<div class=\"w3-container\">" + "<p>Unfortunately, Google thinks you're a bot. Could you " + 
            "please complete the following ReCaptcha to verify you're not? Thanks for your patience!</p><p id='recaptcha'></p>"
            "</div>" 
    // Render a visible Recaptcha (standard V2), with a callback that resends the request with the new key and
    // the special param isV2 which causes the backend to parse this as a V2 Recaptcha
    grecaptcha.render('recaptcha', {
        'sitekey' : '6LcvB7EZAAAAADGTmgBsNxNd-X40u64E70TRmf01',
        'callback': async function(response) {
            try {
            var res = await fetch(APIEndpoint + endpoint.split("?token=")[0] + '?token=' +response + "&isV2=true", details)
            var jsonResult = await res.json()
            displayResult(jsonResult)
            }
            catch(e) {
                displayError(e.message)
            }
        }
      });     
    return 
}