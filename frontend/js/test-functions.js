
async function getItems(endpoint, options) {
    options = options ? options : {method: "GET"}
    try {
        var result = await fetch(APIEndpoint + endpoint, options)
        var json = await result.json()
    }
    catch(e) {
        console.log("Error while making API call")
        console.log(e)
        return
    }
    if (endpoint.search("id=") != -1 && document.location.href.search("/admin/") == -1) {
        renderItem(json)
        return
    }
    else if (endpoint.search("id=") != -1 && document.location.href.search("/admin/") != -1) {
        preFillFormFields(json)
        return
    }
    for (var i=0; i<json.items.length; i++) {
        if (endpoint.search("horses") != -1) {
            document.getElementById('row').innerHTML +=
            '      <div class="w3-col l3 m6 w3-margin-bottom" style="height:100%;">' +
            '        <div class="w3-card w3-white">' +
            '    <div style="height: 14em;overflow: hidden;">                    ' +
            '          <img src="http://media.leighrescuecentre.co.uk.s3-website.eu-west-2.amazonaws.com' + encodeURI(json.items[i].images[0]) + '" onerror="this.onerror=null; this.src=\'\'" style="width:100%">' +
            '          </div><div class="w3-container">' +
            '            <h3>' + json.items[i].Name + '</h3>' +
            '            <p style="overflow: hidden;height:7em">' + json.items[i].Description + '</p>' +
            '            <p><a href="' + (document.location.href.search("/admin/") != -1 ? 'create-horse.html' : '/horse-detail-page.html') + '?id=' + encodeURI(json.items[i].id) + 
            '" class="w3-button w3-light-grey w3-block">View</a></p>' +
            '          </div>' +
            '        </div>' +
            '      </div>'
        }
        else {
            document.getElementById('row').innerHTML +=
                '      <div class="w3-col l3 m6 w3-margin-bottom" style="height:100%;">' +
                '        <div class="w3-card w3-white">' +
                '          <div class="w3-container">' +
                '            <h3>' + (json.items[i].Name ? json.items[i].Name : json.items[i].FullName) + '</h3>' +
                '            <p class="w3-opacity">' + 
                (json.items[i].date ? "Submitted on: " + new Date(json.items[i].date*1000).toDateString() + "<br>" : "") + '</p>' +
                '            <p style="overflow: hidden;max-height:10em">' + 
                (json.items[i].Message ? json.items[i].Message.replace("\n\n", "<br><br>") : "Email Address:<br>"+ json.items[i].EmailAddress + "<br>") + '</p>' +
                '            <p><a  class="w3-button w3-light-grey w3-block"' + 
                "onclick='getItems(\"" + endpoint.split("?")[0] + "?id=" + json.items[i].id + "\", " +  JSON.stringify(options) +"); document.getElementById(\"details\").style.display = \"block\";'>View</a></p>" +
                '          </div>' +
                '        </div>' +
                '      </div>' 
        }
    }
    if (json.continueKey && endpoint.search("?limit=") == -1) {
        endpoint = endpoint.split("?continueKey=")[0] + "?continueKey=" + json.continueKey
        getItems(endpoint, options)
    }
}

async function renderItem(data) {
    document.getElementById("name").innerText = data.items[0].Name
    for (image in data.items[0].images) {
        document.getElementById("media").innerHTML += '<img class="mySlides w3-animate-opacity" src="http://media.leighrescuecentre.co.uk.s3-website.eu-west-2.amazonaws.com' + encodeURI(data.items[0].images[image]) + '" style="width:100%">'
    }
    showDivs(1);
    for (video in data.items[0].videos) {
        document.getElementById("media").innerHTML += '<video class="mySlides w3-animate-opacity" controls style="width: 100%;">' +
            '    <source src="http://media.leighrescuecentre.co.uk.s3-website.eu-west-2.amazonaws.com' + 
            encodeURI(data.items[0].videos[video]) + '" type="video/' + data.items[0].videos[video].split(".")[data.items[0].videos[video].split(".").length-1] + '">' +
            '    Your browser does not support the video tag.' +
            '</video>'

    }

    document.getElementById("details").innerText = "Age: " + data.items[0].Age + " | Breed: " + data.items[0].Breed + " | " + data.items[0].Sex + " | Height: " +
        data.items[0].Height + " | Suitable as a: " + data.items[0].SuitableFor + " | Rehoming Fee: " + data.items[0].RehomingFee
    for (var i = 1; i < (data.items[0].videos.length + data.items[0].images.length + 1); i++) {
        document.getElementById("dots").innerHTML += '<span class="dot" onclick="moveToDiv(' + i.toString() + ')"></span>'
    }
    document.getElementById("description").innerHTML = "<br><br>" + data.items[0].Description.replace(new RegExp("\n\n", "g"), '<br><br>') + "<br><br>"
}

function preFillFormFields(data) {
    var dbCols = Object.keys(data.items[0])
    for (var i=0; i < dbCols.length; i++) {
        console.log(dbCols[i])
        if (document.querySelector("#" + dbCols[i])) {
            document.getElementById(dbCols[i]).value = data.items[0][dbCols[i]]
        }
        else if (Object.prototype.toString.call(data.items[0][dbCols[i]]) == "[object Array]" && dbCols[i] != "videos" && dbCols[i] != "images") {
            for (var item=0; item < data.items[0][dbCols[i]].length; item++) {
                if (document.querySelector("#" + data.items[0][dbCols[i]][item])) {
                    document.getElementById(data.items[0][dbCols[i]][item]).checked = true
                }
            }
        }
        else {
            console.log("Unable to find a form field for the record " + dbCols[i] + "  " + data.items[0][dbCols[i]].toString())
        }
    }
    if (data.items[0].videos || data.items[0].images) {
        data.items[0].videos.forEach(item => {  filesToUpload.push({name: item.split("/")[item.split("/").length-1], alreadyUploaded: true, type: "video"})})
        data.items[0].images.forEach(item => { filesToUpload.push({name: item.split("/")[item.split("/").length-1], alreadyUploaded: true, type: "image"})})
        listFiles()
    }
}
