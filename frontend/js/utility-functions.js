/**
 * This file contains the functions required for the menu sidebar to work
 */

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