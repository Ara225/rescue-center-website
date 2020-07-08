function scanData(tableName, isAdmin, html) {
            var params = {
                TableName: tableName,
            };
        
            if (!document.getElementById("renderTarget")) {
                params.Limit = 3

            }
            else {
                document.getElementById('renderTarget').innerHTML = html 
                document.getElementById('renderTarget').innerHTML += '<div class="w3-container">' +
                '    <div class="w3-row-padding w3-grayscale" id="row">'+
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
                    console.log("Scan succeeded. ")
                    data.Items.forEach(function(horse) {
                        document.getElementById('row').innerHTML += 
                        '      <div class="w3-col l3 m6 w3-margin-bottom" style="height:100%;">' +
                        '        <div class="w3-card w3-white">' +
                        '          <img src="http://backend-websitebucket74b0f9e5-gayttyln7n1k.s3-website.eu-west-2.amazonaws.com' + encodeURI(horse.images[0]) + '" style="width:100%">' +
                        '          <div class="w3-container">' +
                        '            <h3>' + horse.Name + '</h3>' +
                        '            <p style="overflow: hidden;height:7em">' + horse.Description + '</p>' +
                        '            <p><a href="/horse-detail-page.html?id=' + encodeURIComponent(horse.id) +'" class="w3-button w3-light-grey w3-block">' + actionButton + '</a></p>' +
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
function scanDataList(tableName, isAdmin, html) {
    var params = {
        TableName: tableName,
    };
    document.getElementById('renderTarget').innerHTML = html 
    document.getElementById('renderTarget').innerHTML += '<div class="w3-container w3-theme-l5 w3-center">' +
    '    <div class="w3-content w3-left-align">' +
    '        <div class="w3-container w3-card-2 w3-white">' +
    '            <ul class="w3-ul w3-white" id="row">' +
    '            </ul>' +
    '        </div>' +
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
            data.Items.forEach(function(item) {
                var innerList = ""
                for (i in Object.keys(item)) {
                    innerList += "<b>" + Object.keys(item)[i] + ":</b> " + item[Object.keys(item)[i]] +"<br>"
                }
                document.getElementById('row').innerHTML += 
                '<li class="w3-container">' +
                '    <details class="w3-row">' +
                '        <summary class="w3-large">' + (item.Name ? item.Name : item.FullName) + '</summary>' +
                '        <span class="w3-col m11" style="word-wrap:break-word">' + innerList + '</span>' +
                '        <span class="w3-col m1">' +
                '            <button class="w3-button w3-align-right"><i class="fa fa-trash"></i></button>' +
                '            <button class="w3-button w3-align-right"><i class="fa fa-edit"></i></button>' +
                '        </span>' +
                '    </details>' +
                '</li>' 
            });
            if (data.LastEvaluatedKey && !params.Limit) {
                console.log("Scanning for more...")
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);  
            }          
        }
    }
}