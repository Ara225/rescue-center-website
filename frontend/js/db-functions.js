function scanData(tableName, isAdmin, html) {
    var params = {
        TableName: tableName,
    };

    if (!document.getElementById("renderTarget")) {
        params.Limit = 3
    }
    else {
        document.getElementById('renderTarget').innerHTML = '<div class="w3-container">' +
            '    <div class="w3-row-padding w3-grayscale" id="row">' +
            '    </div>' +
            '</div>'
    }
    console.log("Scanning table.")
    var docClient = new AWS.DynamoDB.DocumentClient();
    docClient.scan(params, onScan);
    if (isAdmin) {
        actionButton = 'View/Edit'
    }
    else {
        actionButton = 'Learn More'
    }
    function onScan(err, data) {
        if (err) {
            console.log("Unable to scan the table: " + JSON.stringify(err, undefined, 2))
        } else {
            data.Items.forEach(function (horse) {
            console.log(horse)

                document.getElementById('row').innerHTML +=
                    '      <div class="w3-col l3 m6 w3-margin-bottom" style="height:100%;">' +
                    '        <div class="w3-card w3-white">' +
                    '          <img src="http://media.leighrescuecentre.co.uk.s3-website.eu-west-2.amazonaws.com' + encodeURI(horse.images[0]) + '" onerror="this.onerror=null; this.src=\'\'" style="width:100%">' +
                    '          <div class="w3-container">' +
                    '            <h3>' + horse.Name + '</h3>' +
                    '            <p style="overflow: hidden;height:7em">' + horse.Description + '</p>' +
                    '            <p><a href="' + (isAdmin ? 'create-horse.html' : '/horse-detail-page.html') + '?id=' + encodeURI(horse.id) + '" class="w3-button w3-light-grey w3-block">' + actionButton + '</a></p>' +
                    '          </div>' +
                    '        </div>' +
                    '      </div>'
            });
            if (data.LastEvaluatedKey && !params.Limit) {
                console.log("Scanning for more...")
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);
            }
        }
    }
}
function scanDataList(tableName) {
    var params = {
        TableName: tableName,
    };
    document.getElementById('renderTarget').innerHTML = '<div class="w3-container">' +
    '    <div class="w3-row-padding w3-grayscale" id="row">' +
    '    </div>' +
    '</div>'

    console.log("Scanning table.")
    var docClient = new AWS.DynamoDB.DocumentClient();
    docClient.scan(params, onScan);
    function onScan(err, data) {
        if (err) {
            console.log("Unable to scan the table: " + JSON.stringify(err, undefined, 2))
        } else {
            console.log("Scan succeeded. ")
            if (data.Items.length == 0) {
                document.getElementById('row').innerHTML = "<h2>No items found</h2>"
                return
            }
            data.Items.forEach(function (item) {
                var innerList = ""
                for (i in Object.keys(item)) {
                    innerList += "<b>" + Object.keys(item)[i] + ":</b> " + item[Object.keys(item)[i]] + "<br>"
                }
                document.getElementById('row').innerHTML +=
                '      <div class="w3-col l3 m6 w3-margin-bottom" style="height:100%;">' +
                '        <div class="w3-card w3-white">' +
                '          <div class="w3-container">' +
                '            <h3>' + (item.Name ? item.Name : item.FullName) + '</h3>' +
                '            <p class="w3-opacity">' + 
                (item.date ? "Submitted on: " + new Date(item.date*1000).toDateString() + "<br>" : "") + '</p>' +
                '            <p style="overflow: hidden;max-height:10em">' + 
                (item.Message ? item.Message.replace("\n\n", "<br><br>") : "Email Address:<br>"+ item.EmailAddress + "<br>") + '</p>' +
                '            <p><a  class="w3-button w3-light-grey w3-block" onclick="readItem(\'' + tableName + '\', \'' + item.id + 
                '\', (data) => {preFillFormFields(data); document.getElementById(\'details\').style.display = \'block\';})">View</a></p>' +
                '          </div>' +
                '        </div>' +
                '      </div>' 
            });
            if (data.LastEvaluatedKey && !params.Limit) {
                console.log("Scanning for more...")
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);
            }
        }
    }
}



function readItem(tableName, id, callback) {
    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: tableName,
        Key: {
            "id": decodeURIComponent(id),
        }
    };
    docClient.get(params, function (err, data) {
        if (err) {
            console.log("Unable to read item: " + JSON.stringify(err, undefined, 2))
        }
        else if (Object.keys(data).length == 0) {
            alert("Invalid ID. Please go back to the rehoming page and try again ")
        }
        else {
            console.log("GetItem succeeded: ")
            console.log(data)
            if (callback) {
                callback(data)
            }
        }
    });
}
async function renderItem(data) {
    document.getElementById("name").innerText = data.Item.Name
    for (image in data.Item.images) {
        document.getElementById("media").innerHTML += '<img class="mySlides w3-animate-opacity" src="http://media.leighrescuecentre.co.uk.s3-website.eu-west-2.amazonaws.com' + encodeURI(data.Item.images[image]) + '" style="width:100%">'
    }
    showDivs(1);
    for (video in data.Item.videos) {
        document.getElementById("media").innerHTML += '<video class="mySlides w3-animate-opacity" controls style="width: 100%;">' +
            '    <source src="http://media.leighrescuecentre.co.uk.s3-website.eu-west-2.amazonaws.com' + 
            encodeURI(data.Item.videos[video]) + '" type="video/' + data.Item.videos[video].split(".")[data.Item.videos[video].split(".").length-1] + '">' +
            '    Your browser does not support the video tag.' +
            '</video>'

    }

    document.getElementById("details").innerText = "Age: " + data.Item.Age + " | Breed: " + data.Item.Breed + " | " + data.Item.Sex + " | Height: " +
        data.Item.Height + " | Suitable as a: " + data.Item.SuitableFor + " | Rehoming Fee: " + data.Item.RehomingFee
    for (var i = 1; i < (data.Item.videos.length + data.Item.images.length + 1); i++) {
        document.getElementById("dots").innerHTML += '<span class="dot" onclick="moveToDiv(' + i.toString() + ')"></span>'
    }
    document.getElementById("description").innerHTML = "<br><br>" + data.Item.Description.replace(new RegExp("\n\n", "g"), '<br><br>') + "<br><br>"
}

function preFillFormFields(data) {
    var dbCols = Object.keys(data.Item)
    for (var i=0; i < dbCols.length; i++) {
        console.log(dbCols[i])
        if (document.querySelector("#" + dbCols[i])) {
            document.getElementById(dbCols[i]).value = data.Item[dbCols[i]]
        }
        else if (Object.prototype.toString.call(data.Item[dbCols[i]]) == "[object Array]" && dbCols[i] != "videos" && dbCols[i] != "images") {
            for (var item=0; item < data.Item[dbCols[i]].length; item++) {
                if (document.querySelector("#" + data.Item[dbCols[i]][item])) {
                    document.getElementById(data.Item[dbCols[i]][item]).checked = true
                }
            }
        }
        else {
            console.log("Unable to find a form field for the record " + dbCols[i] + "  " + data.Item[dbCols[i]].toString())
        }
    }
    if (data.Item.videos || data.Item.images) {
        data.Item.videos.forEach(item => {  filesToUpload.push({name: item.split("/")[item.split("/").length-1], alreadyUploaded: true, type: "video"})})
        data.Item.images.forEach(item => { filesToUpload.push({name: item.split("/")[item.split("/").length-1], alreadyUploaded: true, type: "image"})})
        listFiles()
    }
}