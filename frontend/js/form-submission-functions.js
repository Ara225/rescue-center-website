
/**
 * This file contains logic necessary to make form submission work and display feedback to the user
 * 
*/
function formToJSON(form) {
    var data = {}
    for (var i = 0; i < form.length; i++) {
        console.log(form[i].id)
        // This allows skipping fields
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
                console.log(data)
            }
        }
    }
    return data;
}
async function onRehomerFormSubmit(token, isUpdate) {
    document.getElementById("submit").innerHTML = 'Submitting <i class="fa fa-spinner fa-spin"></i>'
    document.getElementById("submit").disabled = true
    try {
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
        var details = {method: (isUpdate ? "PUT" : "POST"), body: JSON.stringify(form)}
        if (isUpdate) {
            if (!confirm("This action will edit a preexisting record. Is this OK?")) {
                return alert("Operation cancelled at user request")
            }
            details.headers = { Authorization: window.sessionStorage.id_token }
        }
        var endpoint = "rehomers"
        if (token) {
            endpoint += "?token=" + token
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
        console.log(form)
        console.log(token)
        if (token) {
            endpoint = endpoint + "?token=" + token
        }
        var res = await fetch(APIEndpoint + endpoint, details)
        var jsonResult = await res.json()
        if (res.status == 200 && jsonResult.message == "Score below threshold") {
            displayRecaptcha(endpoint, details)
            return
        }
        console.log(jsonResult)
        displayResult(jsonResult)
    }
    catch(e) {
        displayError(e.message)
    }
}

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

function displayRecaptcha(endpoint, details) {
    document.getElementById('alertBox').style.display='block'
            document.getElementById('alertDiv').innerHTML = "<header class=\"w3-container w3-red\"> " +
            "  <span onclick=\"document.getElementById('alertBox').style.display='none'\" " +
            "  class=\"w3-button w3-display-topright\">&times;</span>  <h2>Security Check</h2>" +
            "</header>" +
            "<div class=\"w3-container\">" + "<p>Unfortunately, Google thinks you're a bot. Could you " + 
            "please complete the following ReCaptcha to verify you're not? Thanks for your patience!</p><p id='recaptcha'></p>"
            "</div>" 
    grecaptcha.render('recaptcha', {
        'sitekey' : '6LcvB7EZAAAAADGTmgBsNxNd-X40u64E70TRmf01',
        'callback': async function(response) {
            try {
            var res = await fetch(APIEndpoint + endpoint.split("?token=")[0] + '?token=' +response + "&isV2=true", details)
            var jsonResult = await res.json()
            console.log(jsonResult)
            displayResult(jsonResult)
            }
            catch(e) {
                displayError(e.message)
            }
        }
      });     
    return 
}