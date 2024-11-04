var pageTitle;
// Function to proivde sitemap suggestions

let sitemapUrls = [];

// Fetch sitemap URLs
async function fetchSitemap() {
    try {
        const response = await fetch('/sitemap');
        sitemapUrls = await response.json();
    } catch (error) {
        console.error("Error fetching sitemap:", error);
    }
}

// Initialize fetching of sitemap URLs
fetchSitemap();

// Function to provide search suggestions
function showSuggestions(input) {
    if (input == "") {
        document.getElementById('suggestions').innerHTML = '';
    }
    const suggestions = sitemapUrls.filter(url => url.toLowerCase().includes(input.toLowerCase()));
    const suggestionBox = document.getElementById('suggestions');
    suggestionBox.innerHTML = '';

    suggestions.forEach(suggestion => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        suggestionItem.innerText = suggestion;
        suggestionItem.onclick = () => {
            document.getElementById('inputField').value = suggestion;
            suggestionBox.innerHTML = '';
        };
        suggestionBox.appendChild(suggestionItem);
    });
}

// Event listener for input field
document.getElementById('inputField').addEventListener('input', (event) => {
    showSuggestions(event.target.value);
});


// Errors listing 
var errorCountProperties = 0, errorCountPage = 0, errorsList;

// Check function
function checkProperty() {
    const url = document.getElementById("inputField").value;
    let start = url.indexOf("/en");
    let end = url.indexOf(".html");
    let extracted = url.substring(start, end);
    const authorUrl = "https://author-p27556-e127669.adobeaemcloud.com/mnt/overlay/wcm/core/content/sites/properties.html?item=/content/websites/languages" + extracted;
    const Edit = "https://author-p27556-e127669.adobeaemcloud.com/editor.html/content/websites/languages" + extracted + ".html";
    console.log(authorUrl);
    // Setting author url & Edit url
    document.getElementById("author-url").setAttribute('href', authorUrl);
    document.getElementById("edit-url").setAttribute('href', Edit);
    // Error list is empty
    errorCountPage = 0; errorCountPage = 0, errorsList = []
    // Sending url to nodejs to fetch properties
    if (url == "") {
        alert("Please enter URL")
    } else {
        // Show loading spinner
        document.getElementById("loading").style.display = "block";
        sendNodejs(url);
    }
}

// Function to send url to node file
function sendNodejs(url) {
    fetch('/pageUrl', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url }),
    }).then(res => {
        if (res.ok) {
            console.log("Data fetched successfully");
            return res.json();
        } else {
            console.error('Failed to send data');
        }
    }).then(data => {
        if (data) {
            const pageAttribute = data;
            // Hide loading spinner
            document.getElementById("loading").style.display = "none";
            document.getElementById("output-box").style.display = "inline-block";

            // Sending page attribute to a function to display
            sendingObject(pageAttribute);
        } else {
            document.getElementById("loading").style.display = "none";
            console.error("Received data is undefined or does not have 'gettedvalue'");
        }
    }).catch(err => {
        document.getElementById("loading").style.display = "none";
        console.log("Error:", err);
    });
}

// Function to display result got from nodejs file
function sendingObject(obj) {
    if (obj.gettedvalue != null) {
        console.log(obj);
        const pageProperty = obj.gettedvalue.dataLayerAttributes;
        const PageComponents = obj.gettedvalue;
        const hyperlinks = obj.gettedvalue.hyperlinks;
        pageTitle=obj.gettedvalue.dataLayerAttributes.pageTitle;
        allLinks = hyperlinks;
        console.log(hyperlinks)
        console.log(pageProperty);
        let start = obj.gettedvalue.emptyTags["aem-Grid"].indexOf('"');
        let end = obj.gettedvalue.emptyTags["aem-Grid"].lastIndexOf('"');
        console.log(obj.gettedvalue.emptyTags["aem-Grid"].substring(start + 1, end))
        var results = document.getElementById("results");
        var pageResult = document.getElementById("pageResult");
        results.innerHTML = `<div class="row-value">
                        <p class="fw-bold">Property</p>
                        <p class="fw-bold">Property value</p>
                        <p class="fw-bold">Status</p>
                    </div>`;
        pageResult.innerHTML = `<div class="row-value">
                    <p class="fw-bold">Components</p>
                    <p class="fw-bold">Status</p>
                    </div>`;
        document.getElementById("templateName").innerText = keycamelCase(pageProperty["pageTemplate"]) + " Template";

        var mandatoryFields = ["pageTemplate", "pageTitle", "description", "authors", "primarySubject", "secondarySubject", "contentState", "thumbnailUrl", "siteSection"];
        var pageField = ["bannerImage", "h1Tag", "breadcrumbs", "inPageNav", "promoComponent"];

        pageField.forEach(property => {
            for (var key in PageComponents) {
                if (key == property) {
                    console.log(key)
                    var div = document.createElement("div");
                    div.classList.add("row-value");

                    var component = document.createElement("p");
                    component.classList.add("fw-bold");
                    var componentStatus = document.createElement("p");
                    componentStatus.classList.add("fw-bold");
                    component.innerText = keycamelCase(key);

                    if (key == 'promoComponent') {
                        // Check if all elements in the promoConfigured array are true
                        var allTrue;
                        console.log(PageComponents[key], PageComponents[key])
                        if (PageComponents[key].length > 0) {
                            allTrue = PageComponents[key].every(element => element === true);
                        } else {
                            allTrue = null;
                        }
                        if (allTrue && allTrue != null) {
                            componentStatus.classList.add("text-success");
                            componentStatus.innerHTML += `<p class="fw-bold"> ${PageComponents[key].length} promos found <i class="fa-solid fa-check-circle"></i></p>`; // Green check icon
                        } else if (allTrue == null) {
                            componentStatus.innerHTML += '<p class="warning">Promo component is missing <i class="fa-solid fa-triangle-exclamation text-warning"></i></p>';
                        } else {
                            componentStatus.innerHTML += '<p class="warning">Promo is not configured correctly <i class="fa-solid fa-triangle-exclamation text-warning"></i></p>';
                        }
                    } else if (PageComponents[key] === true) {
                        componentStatus.classList.add("text-success");
                        componentStatus.innerHTML += '<p class="fw-bold">Ok <i class="fa-solid fa-check-circle"></i></p>'; // Green check icon
                    } else {
                        errorCountPage++;
                        componentStatus.classList.add("fw-bold", "text-danger");
                        componentStatus.innerHTML += '<p>missing <i class="fa-solid fa-circle-exclamation"></i></p>'; // Red alert icon
                    }
                    div.appendChild(component)
                    div.appendChild(componentStatus)
                    document.getElementById("pageResult").appendChild(div);
                }
            }
        })

        mandatoryFields.forEach(field => {
            console.log(field);
            for (var key in pageProperty) {
                if (key == field) {
                    var div = document.createElement("div");
                    div.classList.add("row-value");

                    var ptitles = document.createElement("p");
                    ptitles.classList.add("fw-bold");
                    var pprop = document.createElement("p");
                    var pstatus = document.createElement("p");

                    if (key == "authors" && pageProperty[key] == "") {
                        pstatus.classList.add("fw-bold");
                        pstatus.innerHTML += '<p class="warning">Warning <i class="fa-solid fa-triangle-exclamation text-warning"></i></p>'; // warning alert icon
                    } else if ((key != "thumbnailUrl" && key != "contentState" && pageProperty[key].trim() !== '') || (key == "thumbnailUrl" && pageProperty[key].includes("/content/dam/assets-shared/img/primary/")) || (key == "contentState" && (pageProperty[key] == "Core" || pageProperty[key] == "Network"))) {
                        pstatus.classList.add("text-success");
                        pstatus.innerHTML += '<p class="fw-bold">Ok <i class="fa-solid fa-check-circle"></i></p>'; // Green check icon
                    } else {
                        errorsList.push(key)
                        errorCountProperties++;
                        pstatus.classList.add("fw-bold", "text-danger");
                        pstatus.innerHTML += '<p>Error <i class="fa-solid fa-circle-exclamation"></i></p>'; // Red alert icon
                    }
                    ptitles.innerText = keycamelCase(key);
                    pprop.innerText = pageProperty[key];
                    div.appendChild(ptitles);
                    div.appendChild(pprop);
                    div.appendChild(pstatus);
                    results.appendChild(div);
                }
            }
        });

        // Calling hyperlink function
        showlinks(hyperlinks, "al");

        // Displaying errors and status in template name-row
        document.getElementById("total-errors").innerText = errorsList.length + errorCountPage;
        document.getElementById("status").innerHTML = errorsList.length + errorCountPage > 0 ? '<span class="text-danger">Failed<i class="fa-regular fa-circle-xmark text-danger"></i></span>' : '<span style="color:green">Passed<i class="fa-regular fa-circle-check"></i></span>';
        changeColor();
    }
    else {
        document.getElementById("pageResult").innerHTML = " <h1>404 Error</h1>";
        document.getElementById("results").innerHTML = " <h1>404 Error</h1>";
        document.getElementById("pageLinks").innerHTML = " <h1>404 Error</h1>";
    }
}

// Declaring variables
var of = "www2.deloitte.com/";
var gb = "www.deloitte.com/global";
var gb_pr = "https://preview2.deloitte.com";

var index = 1;
var currentSortColumn = '';
var currentSortOrder = 'asc';

// Getting and showing hyper links
function showlinks(hyperlinks, selectedvalue) {
    hyperlinks = [...new Set(hyperlinks)];
    console.log(hyperlinks)
    index = 1;
    var anchorLinks = document.getElementById("anchorLinks");
    anchorLinks.innerHTML = "";

    // Create table headers
    var table = document.createElement('table');
    table.id = "tableLinks";
    // table.setAttribute(id,"tableLinks")
    var thead = document.createElement('thead');
    var tbody = document.createElement('tbody');
    var headerRow = document.createElement('tr');
    var linkHeader = document.createElement('th');
    var statusHeader = document.createElement('th');
    var pdfPropertiesHeader = document.createElement('th');

    linkHeader.innerHTML = `Link <i class="fa fa-sort" onclick="sortTable('link')"></i>`;
    statusHeader.innerHTML = `Status <i class="fa fa-sort" onclick="sortTable('status')"></i>`;
    pdfPropertiesHeader.innerHTML = `PDF Properties <i class="fa fa-sort" onclick="sortTable('pdfProperties')"></i>`;

    headerRow.appendChild(linkHeader);
    headerRow.appendChild(statusHeader);
    headerRow.appendChild(pdfPropertiesHeader);
    thead.appendChild(headerRow);
    table.appendChild(thead);
    table.appendChild(tbody);
    anchorLinks.appendChild(table);

    hyperlinks.forEach(({ link, status }) => {
        if (selectedvalue === "mf" && !link.includes(of)) return;
        if (selectedvalue === "gb" && !(link.includes(gb) || link.includes(gb_pr))) return;
        if (selectedvalue === "pdf" && !link.includes(".pdf")) return;
        if (selectedvalue === "sl" && !link.includes("profiles")) return;
        if (selectedvalue === "el" && (link.includes("www.deloitte.com") || link.includes("www2") || link.includes("preview2.deloitte.com"))) return;

        var row = document.createElement('tr');
        var linkCell = document.createElement('td');
        var statusCell = document.createElement('td');
        var pdfPropertiesCell = document.createElement('td');

        let a = document.createElement('a');
        a.href = link;
        a.innerText = link;
        a.target = "_blank";

        linkCell.appendChild(a);
        statusCell.innerText = status;

        if (link.endsWith('.pdf')) {
            // Fetch and display PDF properties
            fetchPDFProperties(link).then(properties => {
                pdfPropertiesCell.innerText = properties;
            }).catch(error => {
                pdfPropertiesCell.innerText = "Error fetching properties";
            });
        } else {
            pdfPropertiesCell.innerText = "N/A";
        }

        row.appendChild(linkCell);
        row.appendChild(statusCell);
        row.appendChild(pdfPropertiesCell);
        tbody.appendChild(row);
    });
}

// Function to fetch PDF properties
async function fetchPDFProperties(link) {
    try {
        const response = await fetch(link);
        const arrayBuffer = await response.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const metadata = pdfDoc.getTitle() || "No title";
        const author = pdfDoc.getAuthor() || "No author";
        const subject = pdfDoc.getSubject() || "No subject";
        const keywords = pdfDoc.getKeywords() || "No keywords";
        return `Title: ${metadata}, Author: ${author}, Subject: ${subject}, Keywords: ${keywords}`;
    } catch (error) {
        console.error("Error fetching PDF properties:", error);
        return "Error fetching properties";
    }
}

function addlink(link) {
    console.log("added")

    var anchorLinks = document.getElementById("anchorLinks");

    var div = document.createElement('div');
    div.classList.add('row-value');
    let a = document.createElement('a');
    a.href = link;
    a.innerText = (index++) + ". " + link;
    a.target = "_blank"
    div.appendChild(a);
    anchorLinks.appendChild(div);
}

function linkSelection() {
    const optedValue = document.getElementById("category").value;
    showlinks(allLinks, optedValue);
}

// Function to convert the title to title case
function keycamelCase(str) {
    let newStr = str.replace(/([a-z])([A-Z])/g, '$1 $2');
    newStr = newStr.split('');
    newStr[0] = newStr[0].toUpperCase();
    return newStr.join('');
}

// Function to show only properties tab
function properties() {
    document.getElementById("property-tab").classList.add("active");
    document.getElementById("page-tab").classList.remove("active");
    document.getElementById("link-tab").classList.remove("active");
    document.getElementById("pageResult").style.display = "none";
    document.getElementById("results").style.display = "block";
    document.getElementById("output-box").style.display = "inline-block";
    document.getElementById("pageLinks").style.display = "none";
}

function page() {
    document.getElementById("output-box").style.display = "inline-block";
    document.getElementById("pageResult").style.display = "block";
    document.getElementById("pageLinks").style.display = "none";
    document.getElementById("results").style.display = "none";
    document.getElementById("property-tab").classList.remove("active");
    document.getElementById("link-tab").classList.remove("active");
    document.getElementById("page-tab").classList.add("active");
}

function pageLink() {
    document.getElementById("output-box").style.display = "inline-block";
    document.getElementById("pageLinks").style.display = "block";
    document.getElementById("pageResult").style.display = "none";
    document.getElementById("results").style.display = "none";
    document.getElementById("property-tab").classList.remove("active");
    document.getElementById("page-tab").classList.remove("active");
    document.getElementById("link-tab").classList.add("active");
}

function changeColor() {
    if (errorCountPage > 0 || errorsList.length > 0) {
        document.querySelector("body").classList.add("invalid");
        document.querySelector("body").classList.remove("valid");
    } else {
        document.querySelector("body").classList.remove("invalid");
        document.querySelector("body").classList.add("valid");
    }
}

// Taking screenshot function
function screenshot() {
    const url = document.getElementById("inputField").value;
    const publishedUrl = url;
    fetch('/screenshot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: publishedUrl }),
    })
}

// Function to sort table
function sortTable(column) {
    const table = document.querySelector('#anchorLinks table tbody');
    const rows = Array.from(table.querySelectorAll('tr'));
    let compare;

    if (currentSortColumn === column && currentSortOrder === 'asc') {
        currentSortOrder = 'desc';
    } else {
        currentSortOrder = 'asc';
    }

    currentSortColumn = column;

    if (column === 'link') {
        compare = (a, b) => a.querySelector('td a').innerText.localeCompare(b.querySelector('td a').innerText);
    } else if (column === 'status') {
        compare = (a, b) => a.querySelector('td:nth-child(2)').innerText.localeCompare(b.querySelector('td:nth-child(2)').innerText);
    } else if (column === 'pdfProperties') {
        compare = (a, b) => a.querySelector('td:nth-child(3)').innerText.localeCompare(b.querySelector('td:nth-child(3)').innerText);
    }

    rows.sort(compare);

    if (currentSortOrder === 'desc') {
        rows.reverse();
    }

    rows.forEach(row => table.appendChild(row));
}

// Download Excel sheet
function downloadExcel() {
    console.log("clicked");

    var table = document.getElementById('tableLinks');
    var tbody = table.querySelector('tbody');



    // Check if the table element exists
    if (!table) {
        console.error('Table element not found');
        return;
    }
    if (!tbody) {
        console.error('Tbody element not found');
        return;
    }


    // Initialize an array to store the rows data
    var data = [];

    // Identify the thead element
    var thead = table.querySelector('thead');
    if (!thead) {
        console.error('Thead element not found');
        return;
    }

    // Extract and push the header data
    var headerCells = thead.rows[0].cells;
    var headerData = [];
    for (var i = 0; i < headerCells.length; i++) {
        headerData.push(headerCells[i].innerText);
    }
    data.push(headerData);

    // Loop through the table rows
    for (var i = 1, row; row = tbody.rows[i]; i++) {
        console.log(i)
        // Get the link element from the first cell
        var linkElement = row.cells[0].querySelector('a');
        var pageLink = linkElement ? linkElement.href : '';

        // Get the status from the second cell
        var status = row.cells[1] ? row.cells[1].innerText : '';

        // Get the PDF properties from the third cell
        var pdfProperties = row.cells[2] ? row.cells[2].innerText : '';

        // Push the row data to the data array
        data.push([pageLink, status, pdfProperties]);
    }

    // Create a new workbook and a worksheet
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, `${pageTitle}`);

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `${pageTitle}.xlsx`);
}

// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function () {
    var downloadButton = document.getElementById('btn-download');
    if (downloadButton) {
        downloadButton.onclick = downloadExcel;
    } else {
        console.error('Download button not found');
    }
});


// Function to handle the Preview toggle
function togglePreview() {
    const previewToggle = document.getElementById("previewToggle");
    const languageToggleContainer = document.getElementById("languageToggleContainer");
    const inputField = document.getElementById("inputField");

    if (previewToggle.checked) {
        languageToggleContainer.style.display = "block";
        toggleLanguage(); // Initialize with the current state of the Language/Global toggle
    } else {
        languageToggleContainer.style.display = "none";
        resetToDefault();
    }
}

// Function to handle the Language/Global toggle
function toggleLanguage() {
    const languageToggle = document.getElementById("languageToggle");
    const inputField = document.getElementById("inputField");
    const currentUrl = inputField.value;
    const start = currentUrl.indexOf("/en");

    if (start !== -1) {
        const extracted = currentUrl.substring(start);
        if (languageToggle.checked) {
            inputField.value = "https://preview2.deloitte.com/content/websites/global" + extracted;
        } else {
            inputField.value = "https://preview2.deloitte.com/content/websites/languages" + extracted;
        }
    }
}

// Function to reset the URL to its default state
function resetToDefault() {
    const inputField = document.getElementById("inputField");
    const currentUrl = inputField.value;
    const start = currentUrl.indexOf("/en");

    if (start !== -1) {
        const extracted = currentUrl.substring(start);
        inputField.value = "https://www.deloitte.com" + extracted;
    }
}

async function checkingVideo() {
    const status = await fetch("https://www.youtube.com/embed/wJI8ScAVb4M");
    console.log(status)
}
checkingVideo()