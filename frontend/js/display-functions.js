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
        