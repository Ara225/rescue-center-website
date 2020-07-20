/**
 * This file contains functions specifically related to the admin area of the site.
 * The S3 upload relates only to the create horse form
 */

/**
 * Gets credentials from Cognito
 * @param {Function} callback Callback to call when finished
 * @param {Boolean} withAuth If we want to authenticate the users
 */
function getCognitoCreds(callback, withAuth) {
    AWS.config.region = 'eu-west-2';
    if (!withAuth) {
        // Configure the credentials provider to use your identity pool for unauthenticated users
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: 'eu-west-2:62a15244-4f5a-4f12-b9e6-cb87ce7b5806'
        });
    }
    else {
        if ((document.location.hash && document.location.hash.search('id_token') != -1) || window.sessionStorage.id_token) {
            // Configure the credentials provider to use the identity pool for authenticated users
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
    // Make the call to AWS to actually get the credentials
    AWS.config.credentials.get(callback);
}

/**
 * Designed to be used as a callback for getCognitoCreds. Stores Cognito ID in session storage and sets timeouts to let 
 * the user know when their creds will expire in two minutes and finally to redirect them.
 * @param {Function} callback 
 */
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
                redirect()
            }
        }, 3480000);
        setTimeout(function () {
            redirect()
        }, 3600000);
        if (callback) {
            callback()
        }
    }
}

/**
 * Redirects to the Cognito authentication page or to the main /admin/ page if we're not there (Cognito only accepts redirects from
 * that page)
 */
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

// Initialize vars for S3 upload etc
var s3 = null
var filesToUpload = []
var statusField
var filesToDelete = []

/**
 * Handle file selection in a file input box
 * @param {Event} event The triggering event
 */
function handleFileSelect(event) {
    for (i in event.originalTarget.files) {
        console.log((event.originalTarget.files[i]))
        // Some simple validation on the File objects
        if (typeof (event.originalTarget.files[i]) == "object") {
            if (filesToUpload[i].type.search("image") != -1 || filesToUpload[i].type.search("video") != -1) {
                alert("The file " + event.originalTarget.files[i].name + "is not a image or video. Cancelling upload. ")
            }
            else if (filesToUpload.findIndex((item) => {return item.name == event.originalTarget.files[i].name}) != -1) {
                alert("The file " + event.originalTarget.files[i].name + " already exists in the upload list")
            }
            else {
                filesToUpload.push(event.originalTarget.files[i]);
            }
        }
    }
    listFiles()
}

/**
 * Display a list of the files currently selected for upload
 */
function listFiles() {
    var filesDiv = document.getElementById("files")
    filesDiv.innerHTML = ""
    for (file in filesToUpload) {
        filesDiv.innerHTML += '<button class="w3-button w3-red" onclick="removeFileFromList(' + file + ')">' +
            '&times;</button><div class="w3-button w3-light-grey">' + filesToUpload[file].name + "</div><br><br>"
    }
    event.originalTarget.value = null
}

/**
 * Remove a file from the list of files to upload
 * @param {Number} fileNumber 
 */
async function removeFileFromList(fileNumber) {
    // Deal with the file already being uploaded
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

/**
 * Deletes a single S3 object with no children
 * @param {String} key Path to S3 object to delete
 */
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

/**
 * Create a folder to store the horses' photos
 * @param {String} horseName Name of the horse to create a folder
 */
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

/**
 * List objects under a prefix
 * @param {String} prefix Prefix to list
 */
function listS3Objects(prefix) {
    return new Promise((resolve, reject) => {
        s3.listObjects((prefix ? { Prefix: prefix } : {}), function (err, data) {
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

/**
 * Handle submission of create horse form in the admin area
 * @param {Event} event Not used
 */
async function onCreateHorseFormSubmit(event) {
    statusField = document.getElementById("status")
    s3 = new AWS.S3({
        apiVersion: "2006-03-01",
        params: { Bucket: horseBucketName }
    });
    // Handle expired creds
    if (AWS.config.credentials.expired) {
        alert("Your credentials have expired. Redirecting to the login page")
        window.location.href = cognitoURL + document.location.href.split("#")[0].replace("index.html", "");
    }
    // Handle invalid input
    if (filesToUpload.length == 0) {
        alert("Please select some images/videos for upload!")
        return
    }
    // Handle pre-existing horse
    if (document.location.search.search("id") != -1) {
        if (!confirm("Continuing with this form submission will overwrite a preexisting horse. Is this OK?")) {
            window.location.href = window.location.href.split("?")[0]
        }
    }
    // Create folder in S3
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
    // Error handling in function
    var fileResults = await processFileList(horseName)
    if (fileResults) {
        var uploadedPhotoURLs = fileResults[0]
        var uploadedVideoURLs = fileResults[1]
        if (fileResults[2].length == 0) {
            if (!confirm("The following files failed upload: " + fileResults[2].toString() + " would you like to continue? ")) {
                return
            }
        }
    }
    else {
        return
    }
    try {
        var form = formToJSON(document.getElementsByClassName('FormField'));
        if (document.location.search.search("id") != -1) {
            form.id = decodeURIComponent(document.location.search.split("id=")[1])
        }
        form.images = uploadedPhotoURLs
        form.videos = uploadedVideoURLs
        console.log("Status: Attempting database insert")
        statusField.innerText = "Status: Attempting database insert"
        console.log(JSON.stringify(form))
        // Make API call to create record in DB
        var result = await fetch(APIEndpoint + "horses", {
            method: "POST",
            body: JSON.stringify(form),
            headers: { Authorization: window.sessionStorage.id_token }
        })

        var json = await result.json()
        console.log(json)
        displayResult(json)
        statusField.innerText = "Status: Database insert succeeded "
        document.getElementById("files").innerHTML = ""
        filesToUpload = []
        form = null
    }
    catch (e) {
        console.log(e)
        console.log("Status: Database insert failed due to the following error: " + e)
        statusField.innerText = "Status: Database insert failed due to the following error: " + e
    }
}

/**
 * Upload all the files in a list of objects stored in the filesToUpload var (either File object or a custom stripped 
 * down object used for files that are already in S3)  Also deletes all files in the filesToDelete list from S3.
 * @param {String} prefix Section of the path to append tp /media/ - i.e. horse folder name
 */
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
        catch (e) {
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
                uploadedPhotoURLs.push("/media/" + prefix + "/" + filesToUpload[i].name)
            }
            else if (filesToUpload[i].type.search("video") != -1) {
                uploadedVideoURLs.push("/media/" + prefix + "/" + filesToUpload[i].name)
            }
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

/**
 * Copy a single file to S3
 * @param {String} horseName Name of folder
 * @param {File} file File object
 */
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

/**
 * Delete item from S3
 * @param {String} endpoint The endpoint to request to (e.g. horses/)
 * @param {String} folderName Path to object to delete
 */
async function deleteItem(endpoint, folderName) {
    if (!confirm("This will delete this item along with any associated images and videos. This is a permanent action. Is this OK?")) {
        return alert("Operation cancelled at user request")
    }
    try {
        s3 = new AWS.S3({
            apiVersion: "2006-03-01",
            params: { Bucket: horseBucketName }
        });
        if (folderName) {
            deleteFolder(folderName)
        }
        console.log("Status: Attempting delete")
        var result = await fetch(APIEndpoint + endpoint, {
            method: "DELETE",
            headers: { Authorization: window.sessionStorage.id_token }
        })
        var json = await result.json()
        console.log(json)
        displaySuccess("Item deleted", "Success")
    }
    catch (e) {
        console.log(e)
        console.log("Status: Delete failed due to the following error: " + e)
        displayError(e, "Delete failed ")
    }
}

/**
 * Update object in DB (for publicly available endpoints, PUT is a extra method for updating objects)
 * @param {String} endpoint The endpoint to request to (e.g. horses/)
 * @param {Object} data JSON data to send in the body of the request
 */
async function updateItem(endpoint, data) {
    try {
        console.log("Status: Attempting database update")
        var result = await fetch(APIEndpoint + endpoint, {
            method: "PUT",
            body: JSON.stringify(data),
            headers: { Authorization: window.sessionStorage.id_token }
        })

        var json = await result.json()
        console.log(json)
        displayResult(json)
    }
    catch (e) {
        console.log(e)
        console.log("Status: Delete failed due to the following error: " + e)
    }
}

/**
 * Delete folder from S3
 * @param {String} folderName 
 */
function deleteFolder(folderName) {
    var albumKey = folderName;
    return new Promise((resolve, reject) => {
        s3.listObjects({ Prefix: albumKey }, function (err, data) {
            if (err) {
                console.log("There was an error deleting your folder: ", err.message);
                return reject("There was an error deleting the folder: ", err.message)
            }
            var objects = data.Contents.map(function (object) {
                return { Key: object.Key };
            });
            s3.deleteObjects(
                {
                    Delete: { Objects: objects, Quiet: true }
                },
                function (err, data) {
                    if (err) {
                        console.log("There was an error deleting your folder: ", err.message);
                        return reject("There was an error deleting the folder: ", err.message)
                    }
                    console.log("Successfully deleted album.");
                    return resolve("Successfully deleted album.")
                }
            );
        });
    });
}