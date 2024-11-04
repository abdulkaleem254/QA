
var errorCountProperties,errorCountPage,errorsList;

// check function
function checkProperty() {
    const url = document.getElementById("inputField").value;
    let start = url.indexOf("/en");
    let end = url.indexOf(".html");
    let extracted = url.substring(start, end);
    const authorUrl="https://author-p27556-e127669.adobeaemcloud.com/mnt/overlay/wcm/core/content/sites/properties.html?item=/content/websites/languages"+extracted;
    const Edit="https://author-p27556-e127669.adobeaemcloud.com/editor.html/content/websites/languages"+extracted+".html";
    console.log(authorUrl);
    // setting author url & Preview url
    document.getElementById("author-url").setAttribute('href',authorUrl);
    document.getElementById("preview-url").setAttribute('href',Edit);
    // error list is empty
    errorCountPage=0;errorCountPage=0,errorsList=[]
    // sending url to nodejs to fetch properties
    if(url=="")
    {
        alert("Please enter URL")
    }
    else{
        // Show loading spinner
        document.getElementById("loading").style.display = "block";
        sendNodejs(url);
    }
}


// function to send url to node file
function sendNodejs(url) {
    fetch('/kaleem',{
        method : 'POST',
        headers : {
            'Content-Type':'application/json',
        },
        body: JSON.stringify({url:url}),
    }).then(res => {
        if(res.ok) {
            console.log("data get successfully");
            return res.json();
        } else {
            console.error('Failed to send data');
        }
    }).then(data => {
        if(data) {
            const pageAttribute = data;
            // Hide loading spinner
            document.getElementById("loading").style.display = "none";
            document.getElementById("output-box").style.display = "block";
            
            // sending page attribute to a function to display
            sendingObject(pageAttribute);
        } else {
            document.getElementById("loading").style.display = "none";
            console.error("Received data is undefined or does not have 'gettedvalue'");
        }
    }).catch(err => {
        document.getElementById("loading").style.display = "none";
        console.log("error :" ,err);
    });
}


// function to display result got from nodejs file
function sendingObject(obj) {
    console.log(obj);
    const pageProperty = obj.gettedvalue.dataLayerAttributes;
    const PageComponents = obj.gettedvalue;
    console.log(pageProperty);
    // console.log(obj.gettedvalue.emptyTags["title-v2"])
    let start=obj.gettedvalue.emptyTags["aem-Grid"].indexOf('"');
    let end=obj.gettedvalue.emptyTags["aem-Grid"].lastIndexOf('"');
    console.log(obj.gettedvalue.emptyTags["aem-Grid"].substring(start+1,end))
    var results=document.getElementById("results");
    var pageResult=document.getElementById("pageResult");
    results.innerHTML=`<div class="row-value">
                        <p class="fw-bold">Property</p>
                        <p class="fw-bold">Property value</p>
                        <p class="fw-bold">Status</p>
                    </div>`;
    pageResult.innerHTML=`<div class="row-value">
                    <p class="fw-bold">Components</p>
                    <p class="fw-bold">Status</p>
                    </div>`;    
    document.getElementById("templateName").innerText=keycamelCase(pageProperty["pageTemplate"])+" Template";

    var mandatoryFields = ["pageTemplate", "pageTitle", "description", "authors","primarySubject", "secondarySubject", "contentState", "thumbnailUrl", "siteSection"];
    var pageField=["bannerImage","h1Tag","breadcrumbs","inPageNav","promoComponent"];
    
    pageField.forEach(property=>{
        for(var key in PageComponents){
            if(key==property)
            {
                console.log(key)
                var div=document.createElement("div");
                div.classList.add("row-value");
            
                var component=document.createElement("p");
                component.classList.add("fw-bold");
                var componentStatus=document.createElement("p");
                componentStatus.classList.add("fw-bold");
                // if(key=="breadcrumbs"){
                //     component.innerText="Breadcrumbs";
                // }
                // else{
                //     component.innerText="In Page Navigation";
                // }
                component.innerText=keycamelCase(key);
                
                if(key=='promoComponent')
                {
                    // Check if all elements in the promoConfigured array are true
                    var allTrue;
                    console.log(PageComponents[key],PageComponents[key])
                    if(PageComponents[key].length>0)
                    {
                        allTrue = PageComponents[key].every(element => element === true);
                    }
                    else
                    {
                        allTrue=null;
                    }
                    if(allTrue && allTrue!=null)
                    {
                        componentStatus.classList.add("text-success");
                        componentStatus.innerHTML += `<p class="fw-bold"> ${PageComponents[key].length} promos found <i class="fa-solid fa-check-circle"></i></p>`; // Green check icon
                    }
                    else if(allTrue==null)
                    {
                        errorCountPage++;
                        componentStatus.classList.add("fw-bold","text-danger");
                        componentStatus.innerHTML += '<p>Promo component is missing <i class="fa-solid fa-circle-exclamation"></i></p>'; // Red alert icon
                    }
                    else{
                        errorCountPage++;
                        componentStatus.classList.add("fw-bold","text-danger");
                        componentStatus.innerHTML += '<p>Promo is not configured correctly <i class="fa-solid fa-circle-exclamation"></i></p>'; // Red alert icon

                    }
                }
                else if(PageComponents[key]===true )
                {
                    componentStatus.classList.add("text-success");
                    componentStatus.innerHTML += '<p class="fw-bold">Ok <i class="fa-solid fa-check-circle"></i></p>'; // Green check icon
                } else 
                {
                    errorCountPage++;
                    componentStatus.classList.add("fw-bold","text-danger");
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
        for(var key in pageProperty) {
            if(key == field) {
                var div=document.createElement("div");
                div.classList.add("row-value");
                
                var ptitles=document.createElement("p");
                ptitles.classList.add("fw-bold");
                var pprop=document.createElement("p");
                var pstatus=document.createElement("p");
                

                if((key!="thumbnailUrl" && key!="contentState" && pageProperty[key].trim() !== '') || (key=="thumbnailUrl" && pageProperty[key].includes("/content/dam/assets-shared/img/primary/")) || (key=="contentState" && pageProperty[key]=="Core" || pageProperty[key]=="Network")) {
                    pstatus.classList.add("text-success");
                    pstatus.innerHTML += '<p class="fw-bold">Ok <i class="fa-solid fa-check-circle"></i></p>'; // Green check icon
                } else {
                    errorsList.push(key)
                    errorCountProperties++;
                    pstatus.classList.add("fw-bold","text-danger");
                    pstatus.innerHTML += '<p>Error <i class="fa-solid fa-circle-exclamation"></i></p>'; // Red alert icon
                }
                ptitles.innerText=keycamelCase(key);
                pprop.innerText=pageProperty[key];
                div.appendChild(ptitles);
                div.appendChild(pprop);
                div.appendChild(pstatus);
                results.appendChild(div);

            }
        }
    }); 
    changeColor();
}


// function to convert the title to title case
function keycamelCase(str)
{
    let newStr=str.replace(/([a-z])([A-Z])/g,'$1 $2');
    newStr=newStr.split('');
    newStr[0]=newStr[0].toUpperCase();
    return newStr.join('');
}

// function to show only properties tab
function properties()
{
    document.getElementById("property-tab").classList.add("active");
    document.getElementById("page-tab").classList.remove("active");
    document.getElementById("pageResult").style.display="none";
    document.getElementById("results").style.display="block";
    document.getElementById("output-box").style.display="block";
    
}
function page()
{
    
    document.getElementById("output-box").style.display="block";
    document.getElementById("pageResult").style.display="block";
    document.getElementById("results").style.display="none";
    document.getElementById("property-tab").classList.remove("active");
    document.getElementById("page-tab").classList.add("active");

}

function changeColor()
{
    
    if(errorsList.length>0)
    {

        document.querySelector("body").classList.add("invalid");
        document.querySelector("body").classList.remove("valid");
    }
    else{
        document.querySelector("body").classList.remove("invalid");
        document.querySelector("body").classList.add("valid");

    }
}


// taking screenshot function
function screenshot()
{
    const url = document.getElementById("inputField").value;
    let start = url.indexOf("/en");
    let end = url.indexOf(".html");
    let extracted = url.substring(start, end);
    const publishedUrl="https://preview2.deloitte.com/content/websites/languages"+extracted+".html";
    fetch('/screenshot',{
        method:'POST',
        headers : {
            'Content-Type':'application/json',
        },
        body: JSON.stringify({ url: publishedUrl }),
    })
    
}