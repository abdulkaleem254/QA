const { app, BrowserWindow } = require('electron');
const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const appExpress = express();
appExpress.use(express.static('public'));
const bodyParser = require('body-parser');
const { log } = require('console');
appExpress.use(bodyParser.json());

appExpress.post('/kaleem', async (req, res) => {
    try {
        console.log("Program is running, fetching page data...");
        const receivedData = req.body.url;
        console.log("Received data is ", receivedData);
        const gettedvalue = await getPuppeteerValue(receivedData);
        console.log(gettedvalue);
        res.status(200).json({ gettedvalue });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// screenshot function
appExpress.post('/screenshot', async (req,res)=>{
try{
    const pubURL=req.body.url;
    console.log("Taking Screenshot of ",pubURL);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the viewport size
    await page.setViewport({
        width: 1920,
        height: 880,
        deviceScaleFactor: 1,
    });

    await page.goto(pubURL, { waitUntil: 'domcontentloaded' });

    console.log("Page loaded - Ready to take screenshot ")
    

    // Define the directory path for the Downloads folder
    const downloadsDirectory = path.join('C:', 'Users', 'shaikaleem', 'Downloads'); // need to modify this path

    // Generate a random number to append to the screenshot name
    const randomNumber = Math.floor(Math.random() * 1000);
    
    // Take a screenshot of the page
    const screenshotPath = path.join(downloadsDirectory, `fullpage_${randomNumber}.png`);
    await page.screenshot({ fullPage : true, path: screenshotPath });

    console.log("screenshot taken, Please check on Downloads");

    // Send the screenshot back to the client

    res.sendFile(`fullpage_${randomNumber}.png`, { root: downloadsDirectory });
    } 
    catch (error) {
    console.error("Error taking screenshot:", error);
    res.status(500).send("Error taking screenshot");
}
})


async function getPuppeteerValue(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const myproperty = await page.evaluate(() => {
        return dataLayer.page.attributes;
    });
    // Extract content from <meta> tags
    const ogMetaTags = await page.evaluate(() => {
        const metaTags = document.querySelectorAll('meta[property^="og:"]');
        const ogMetaTagsArray = Array.from(metaTags).map(tag => ({
            property: tag.getAttribute('property'),
            content: tag.getAttribute('content')
        }));
        return ogMetaTagsArray;
    });

    // checking for in-page navigation
    const inPageNav=await page.evaluate(()=>{
        // return !!document.querySelector('div[class="cmp-in-page-nav__section cmp-in-page-nav__section--buttons"]');
        return !!document.querySelector('a[class="cmp-in-page-nav__button"]');
        
    })
    
    
    // checking for empty components
    const emptyComponents = await page.evaluate(()=>{
        const emptyelements=[];
        const elements=document.querySelectorAll('.container responsivegrid content-width-1400--with-padding aem-GridColumn aem-GridColumn--default--12');
        elements.forEach(ele=>{
            if(!ele.textContent.trim() && !ele.children.length)
            {
                emptyComponents.push(ele);
            }
        });
        return emptyelements;
    })


    // checking for breadcrumbs
    const breadcrumbs=await page.evaluate(()=>{
        return !!document.querySelector(`div[class="cmp-breadcrumbs__container"]`);
    })

    // checking for h1 tag
    const h1Tag=await page.evaluate(()=>{
        return !!document.querySelector(`h1[class="cmp-title__text"]`);
    })

    
    // / Execute JavaScript in the context of the page to get the empty tags with class names
    const emptyTags = await page.evaluate(() => {
        function isEmptyElement(element) {
            return !element.innerHTML.trim();
        }

        const elements = document.querySelectorAll('*');
        const emptyTags = {};

        elements.forEach(element => {
            if (isEmptyElement(element) && element.classList.length > 0) {
                emptyTags[element.classList[0]] = element.outerHTML;
            }
        });
    console.log("Empty tags  ",emptyTags);
    return emptyTags;
  });

    // checking for promo container configured or not
    const promoComponent=await page.evaluate(()=>{
        return !!document.querySelector(`div[class="cmp-promo-container__content aem-Grid aem-Grid--default--12 aem-Grid--tablet--12 aem-Grid--phone--12 cmp-promo-container-local__content"]`) || !!document.querySelector(`div[class="cmp-container__row cmp-container__row--offset-sm-top-bottom cmp-container__row--offset-lg-left-right aem-Grid aem-Grid--12 "]`);

    })
    if(promoComponent)
    {
        promoValid = await page.evaluate(() => {
            const promoContent = document.querySelectorAll(`div[class="promo cmp-promo--featured-primary rounded-corners-1 box-shadow dcom-theme1-2 aem-GridColumn aem-GridColumn--default--12"]`);

            
            if(promoContent)
            {
                var promoCondition=[];
                promoContent.forEach(promo=>{
                    const h3Filled = promo.querySelector('h3.cmp-promo__content__title.element__primary span.dot-ellipsis.dot-lines-3');
                    const aTagHrefNotEmpty = promo.querySelector('a.cmp-promo-tracking.cmp-promo-curated');
                    const hasImage = promo.querySelector('div.cmp-promo__image.img-square.img-position-bottom');
                    const news = promo.querySelector('span.cmp-promo__content__type');
                    console.log("news ", news);
                    if((h3Filled && h3Filled.textContent.trim() !== '') &&
                    (aTagHrefNotEmpty && aTagHrefNotEmpty.getAttribute('href').trim() !== '') && (hasImage !== null||news==="news"))
                    {
                        promoCondition.push(true);
                    }
                    else{
                        promoCondition.push(false);
                    }
                })
                return promoCondition;

            }
            else{
                return [];
            }
            
        });
    }
    else
    {
        promoValid = [];
    }

    // banner component checking
    const banner= await page.evaluate(()=>{
        return !!document.querySelector(`div[class="cmp-cta__bg-img aem-GridColumn aem-GridColumn--default--12  cmp-scroll-top-margin"]`) || !!document.querySelector(`div[class="cmp-cta__bg-img aem-GridColumn aem-GridColumn--default--12"]`) || !!document.querySelector(`div[class="image image--hero no-padding-left-right aem-GridColumn aem-GridColumn--default--12"]`) || !!document.querySelector(`div[class="cmp-container-image aem-GridColumn aem-GridColumn--default--12"]` || !!document.querySelector(`div[class="cmp-video__full-screen no-padding aem-GridColumn aem-GridColumn--default--12   cmp-cta__bg-video "]`));
        
    })

    // Combine both sets of data into one object
    const result = {
        dataLayerAttributes: myproperty,
        ogMetaTags: ogMetaTags,
        inPageNav: inPageNav,
        emptyELements : emptyComponents,
        breadcrumbs : breadcrumbs,
        h1Tag : h1Tag,
        emptyTags:emptyTags,
        promoComponent:promoValid,
        bannerImage:banner
    };
    


    await browser.close();
    return result;
}


appExpress.listen(3030, () => {
    console.log("Express server is running on port 3030");
    console.log("Please open http://localhost:3030/");
});




app.whenReady().then(() => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
            nodeIntegration: true
        }
    });

    
    mainWindow.loadURL('http://localhost:3030');
    // mainWindow.loadFile('./public/index.html');

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
