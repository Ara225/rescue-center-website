
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
        displaySuccess(result.id)
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
                                                    "  <p>Thanks for your query. Your reference is: " + text + "</p>" +
                                                    "  <p>We'll try to get back to you within seven working days.</p>" +
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