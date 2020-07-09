function redirect() {
    if (document.location.pathname.endsWith("index.html") || document.location.pathname.endsWith("/admin/")) {
        document.body.innerHTML = '<h2 class="w3-center">Login Required</h2><p  class="w3-center">If not redirected, please click <a href="' +
        cognitoURL + document.location.href.split("?")[0].replace("index.html", "") + '">here</a> to go to the login page</p>'
        window.location.href = cognitoURL + document.location.href.split("#")[0].replace("index.html", "");
    }
    else {
        window.location.href = document.location.origin + "/admin/";
    }
}

function getHtml(template) {
    console.log(template.join('\n'))
    return template.join('\n');
}

var ddb = null
var s3 = null
var filesToUpload = []
var statusField
var filesToDelete = []
function handleFileSelect(event) {
    for (i in event.originalTarget.files) {
        console.log((event.originalTarget.files[i]))
        if (typeof (event.originalTarget.files[i]) == "object") {
            filesToUpload.push(event.originalTarget.files[i]);
        }
    }
    listFiles()
}
function listFiles() {
    var filesDiv = document.getElementById("files")
    filesDiv.innerHTML = ""
    for (file in filesToUpload) {
        filesDiv.innerHTML += '<button class="w3-button w3-red" onclick="removeFileFromList(' + file + ')">' +
            '&times;</button><div class="w3-button w3-light-grey">' + filesToUpload[file].name + "</div><br><br>"
    }
    event.originalTarget.value = null
}

async function removeFileFromList(fileNumber) {
    if (filesToUpload[fileNumber].alreadyUploaded) {
        if (confirm("This file is already uploaded. It would be deleted when you submit this form. Is that OK?")) {
            filesToDelete.push(filesToUpload[fileNumber])
        }
        else {
            return
        }
    }
    filesToUpload.splice(fileNumber, 1)
    listFiles()
}

function deleteS3Object(key) {
    return new Promise((resolve, reject) => {
        s3.deleteObject({ Key: key }, function (err, data) {
            if (err) {
                console.log("There was an error deleting your photo: ", err.message);
                reject(err)
            }
            console.log("Successfully deleted " + key);
            resolve(data)
        })
    })
}


function createFolder(horseName) {
    horseName = horseName.trim();
    if (!horseName) {
        return alert("Horse name must contain at least one non-space character.");
    }
    if (horseName.indexOf("/") !== -1) {
        return alert("Horse name cannot contain slashes.");
    }
    var horseKey = 'media/' + horseName + "/";
    return new Promise((resolve, reject) => {
        s3.headObject({ Key: horseKey }, function (err, data) {
            if (!err) {
                return reject("Horse folder already exists.");
            }
            if (err.code !== "NotFound") {
                console.log(err)
                return reject("There was an error creating a folder for the horse's images/videos: " + err.message);
            }

            s3.putObject({ Key: horseKey }, function (err, data) {
                if (err) {
                    console.log("sss")

                    console.log(err)
                    return reject("There was an error creating a folder for the horse's images/videos: " + err.message);
                }
                return resolve("Successfully created a folder for the horse's images/videos.");
            });
        })
    })
}

function listS3Objects(prefix) {
    return new Promise((resolve, reject) => {
        s3.listObjects((prefix ? { Prefix: prefix } : { }), function(err, data) {
            if (err) {
              return reject("There was an error viewing your album: " + err.message);
            }
            else {
                if (data.Contents.length == 0) {
                   resolve(false)
                }
                else {
                   resolve(data)
                }
            }
        })
    })
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
async function onCreateHorseFormSubmit(event) {
    statusField = document.getElementById("status")
    ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
    s3 = new AWS.S3({
        apiVersion: "2006-03-01",
        params: { Bucket: horseBucketName }
    });
    if (AWS.config.credentials.expired) {
        alert("Your credentials have expired. Redirecting to the login page")
        window.location.href = cognitoURL + document.location.href.split("#")[0].replace("index.html", "");
    }
    if (filesToUpload.length == 0) {
        alert("Please select some images/videos for upload!")
        return
    }

    console.log("Status: Creating folder")
    statusField.innerText = "Status: Creating folder"
    var horseName = document.getElementById("Name").value
    try {
        await createFolder(horseName)
    }
    catch (e) {
        console.log(e)
        if (e.toString().search("Missing credentials in config, if using AWS_CONFIG_FILE, set AWS_SDK_LOAD_CONFIG=1") != -1) {
            redirect()
        }
        else if (e.toString().search("Horse folder already exists.") != -1 && document.location.search.search("id") != -1) {
            statusField.innerText = e
        }
        else {
            statusField.innerText = e
           return
        }
    }
    var fileResults = await processFileList(horseName)
    if (fileResults) {
        var uploadedPhotoURLs = fileResults[0]
        var uploadedVideoURLs = fileResults[1]
        var failedFiles = fileResults[2]
    }
    else {
        return
    }
    try {
        var params = {
            TableName: horsesTableName,
            Item: {
                'id': { S: document.location.search.search("id") != -1 ?
                           decodeURIComponent(document.location.search.split("id=")[1]) :
                           document.getElementById("Name").value + ":" + makeid(32) 
                      },
                'Name': { S: document.getElementById("Name").value },
                'Age': { S: document.getElementById("Age").value },
                'Breed': { S: document.getElementById("Breed").value },
                'Sex': { S: document.getElementById("Sex").value },
                'SuitableFor': { S: document.getElementById("SuitableFor").value },
                'Height': { S: document.getElementById("Height").value },
                'Description': { S: document.getElementById("Description").value },
                'RehomingFee': { S: document.getElementById("RehomingFee").value },
                'images': { L: uploadedPhotoURLs },
                'videos': { L: uploadedVideoURLs }
            }
        };
        console.log("Status: Attempting database insert")
        statusField.innerText = "Status: Attempting database insert"
        var tableResult = await insertIntoTable(params)
        statusField.innerText = "Status: Database insert succeeded "
        displaySuccess("<p>You can view the result <a href='/horse-detail-page.html?id=" + encodeURI(params.id) + "'> here</a>")
        document.getElementById("files").innerHTML = ""
        filesToUpload = []
    }
    catch (e) {
        console.log(e)
        console.log("Status: Database insert failed due to the following error: " + e)
        statusField.innerText = "Status: Database insert failed due to the following error: " + e
    }
}
async function processFileList(prefix) {
    var uploadedPhotoURLs = []
    var uploadedVideoURLs = []
    var failedFiles = []
    for (i in filesToDelete) {
        try {
            console.log("Status: Deleting " + filesToDelete[i].name)
            statusField.innerText = "Status: Deleting " + filesToDelete[i].name
            await deleteS3Object("/media/" + prefix + "/" + filesToDelete[i].name)
        }
        catch(e) {
            console.log("Status: Error " + e.toString() + " while deleting " + filesToDelete[i].name)
            statusField.innerText = "Status: Error " + e.toString() + " while deleting " + filesToDelete[i].name
        }
    }
    for (i in filesToUpload) {
        try {
            if (!filesToUpload[i].alreadyUploaded) {
                console.log("Status: Uploading " + filesToUpload[i].name)
                statusField.innerText = "Status: Uploading " + filesToUpload[i].name
                var upload = await copyFileToS3(prefix, filesToUpload[i])
                console.log("Status: Upload of " + filesToUpload[i].name + " has completed")
                statusField.innerText = "Status: Upload of " + filesToUpload[i].name + " has completed"
            }
            if (filesToUpload[i].type.search("image") != -1) {
                uploadedPhotoURLs.push({ S: "/media/" + prefix + "/" + filesToUpload[i].name })
            }
            else if (filesToUpload[i].type.search("video") != -1) {
                uploadedVideoURLs.push({ S: "/media/" + prefix + "/" + filesToUpload[i].name })
            }
            //TODO Else branch here 
        }
        catch (e) {
            console.log(e)
            console.log("Status: Upload of " + filesToUpload[i].name + " failed")
            statusField.innerText = "Status: Upload of " + filesToUpload[i].name + " failed"
            if (e.toString().search("Missing credentials in config, if using AWS_CONFIG_FILE, set AWS_SDK_LOAD_CONFIG=1") != -1) {
                alert("Your credentials have expired. You need to login again")
                redirect()
            }
            else if (!confirm("The file " + filesToUpload[i].name + " failed upload. Would you like to continue?")) {
                console.log("Cancelled operation at user request")
                return false
            }
            failedFiles.push(filesToUpload[i].name)
        }
    }
    if (failedFiles.length == filesToUpload.length) {
        alert("All files failed upload. Cancelling.")
        return false
    }
    else {
        return [uploadedPhotoURLs, uploadedVideoURLs, failedFiles]
    }
}
function insertIntoTable(params) {
    return new Promise((resolve, reject) => {
        // Call DynamoDB to add the item to the table
        ddb.putItem(params, function (err, data) {
            if (err) {
                console.log("Error", err);
                return reject(err)
            } else {
                console.log("Success", data);
                return resolve(data)
            }
        });
    })
}


function copyFileToS3(horseName, file) {
    var horsePhotosKey = horseName + "/";

    var photoKey = "media/" + horsePhotosKey + file.name;

    // Use S3 ManagedUpload class as it supports multipart uploads
    var upload = new AWS.S3.ManagedUpload({
        params: {
            Bucket: horseBucketName,
            Key: photoKey,
            Body: file,
            ACL: "public-read"
        }
    });

    return upload.promise();
}