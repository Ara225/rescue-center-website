// Quick and dirty. API auth does real work so we don't need more
// cognitoURL should be defined in config.json
var isUsingTokenAuth = null
if (document.location.hash && document.location.hash.search('id_token') != -1) {
    fetch(APIEndpoint + "horses", {
        method: "POST",
        headers: { Authorization: document.location.hash.split("id_token=")[1].split("&access_token=")[0] },
        body: JSON.stringify({
            "FullName": "ASA",
            "EmailAddress": "ASA",
            "Message": "ASA",
            "QueryReason": "ASA",
        })
    }).then(res => {
        res.json().then(jsonResult => { displayResult(jsonResult) }).catch(e => displayError(e.message))
    }).catch(e => displayError(e.message));
}
else {
    document.body.innerHTML = '<h2 class="w3-center">Login Required</h2><p  class="w3-center">If not redirected, please click <a href="' +
        cognitoURL + document.location.href.split("?")[0].replace("index.html", "") + '">here</a> to go to the login page</p>'
    window.location.href = cognitoURL + document.location.href.split("?")[0].replace("index.html", "");
}