
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
function onSubmit(token) {
    document.getElementById("submit").innerHTML = 'Submitting <i class="fa fa-spinner fa-spin"></i>'
    var horseTypeCheckBoxGroup = document.getElementsByClassName('RehomerFormFieldGroup')
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
    var form = formToJSON(document.getElementsByClassName('RehomerFormField'));
    form.HorseType = []
    var HorseType = document.getElementsByClassName('HorseType')
    for (i in HorseType) {
        if (HorseType[i].checked) {
            form.HorseType.push(HorseType[i].id)
        }
    }
    form.HorseUse = []
    var HorseUse = document.getElementsByClassName('HorseUse')
    for (i in HorseUse) {
        if (HorseUse[i].checked) {
            form.HorseUse.push(HorseUse[i].id)
        }
    }
    alert(JSON.stringify(form))
    displayResult("ssss", false)

    /*
                     fetch("http://127.0.0.1:3000/recaptcha_validate", {
              method: "POST", 
              body: JSON.stringify(form)
            }).then(res => {
              res.json().then(res2 => {console.log(res2);displayResult(result, false)})
            });
    */

}
function displayResult(result, error) {
    window.scrollTo(0, 0)
    document.getElementById("RehomerForm").reset()
    if (!error) {
        document.getElementById("alertDiv").style.borderStyle = "solid"
        document.getElementById("alertDiv").innerHTML = "<span class='w3-large'>Form Submitted Successfully </span><br>Your reference is: " +
            result
    }
    else if (error) {
        document.getElementById("alertDiv").style.borderColor = "red"
        document.getElementById("alertDiv").style.borderStyle = "solid"
        document.getElementById("alertDiv").innerHTML = "<span class='w3-large'>Form Failed to Submit</span><br>Submission failed due to this error:" +
            result + " <br>Feel free to try again or contact us with the error"
    }
    document.getElementById("submit").innerText = 'Submit'
}