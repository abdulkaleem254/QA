const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const xml2js = require('xml2js');
const axios = require('axios');

const appExpress = express();
appExpress.use(express.static('public'));
const bodyParser = require('body-parser');
appExpress.use(bodyParser.json());

appExpress.post('/pageUrl', async (req, res) => {
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

// Screenshot function
appExpress.post('/screenshot', async (req, res) => {
    try {
        const pubURL = req.body.url;
        console.log("Taking Screenshot of ", pubURL);
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
        const downloadsDirectory = path.join('C:', 'Users', 'shaikaleem', 'Downloads'); // Modify this path

        // Generate a random number to append to the screenshot name
        const randomNumber = Math.floor(Math.random() * 1000);

        // Take a screenshot of the page
        const screenshotPath = path.join(downloadsDirectory, `fullpage_${randomNumber}.png`);
        await page.screenshot({ fullPage: true, path: screenshotPath });
        console.log("Screenshot taken, please check in Downloads");

        // Send the screenshot back to the client
        res.sendFile(`fullpage_${randomNumber}.png`, { root: downloadsDirectory });
    } catch (error) {
        console.error("Error taking screenshot:", error);
        res.status(500).send("Error taking screenshot");
    }
});

appExpress.get('/sitemap', async (req, res) => {
    try {
        const sitemapUrl = 'https://www.deloitte.com/global/sitemaps/secured/sitemap_global_en.xml'; // Replace with your sitemap URL
        const response = await axios.get(sitemapUrl);
        const sitemapXml = response.data;

        xml2js.parseString(sitemapXml, (err, result) => {
            if (err) {
                console.error("Error parsing sitemap:", err);
                res.status(500).send("Error parsing sitemap");
                return;
            }

            const urls = result.urlset.url.map(entry => entry.loc[0]);
            res.status(200).json(urls);
        });
    } catch (error) {
        console.error("Error fetching sitemap:", error);
        res.status(500).send("Error fetching sitemap");
    }
});

async function getPuppeteerValue(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // Set a common User-Agent string
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');
    // Disable loading of images, CSS, and other unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
            request.abort();
        } else {
            request.continue();
        }
    });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const myproperty = await page.evaluate(() => {
        if (dataLayer.page.attributes.pageTitle !== "404") {

            return dataLayer.page.attributes;
        }
        else {
            return null;
        }
    });
    if (myproperty != null) {
        // Extract content from <meta> tags
        const ogMetaTags = await page.evaluate(() => {
            const metaTags = document.querySelectorAll('meta[property^="og:"]');
            const ogMetaTagsArray = Array.from(metaTags).map(tag => ({
                property: tag.getAttribute('property'),
                content: tag.getAttribute('content')
            }));
            return ogMetaTagsArray;
        });

        // Checking for in-page navigation
        const inPageNav = await page.evaluate(() => {
            return !!document.querySelector('a[class="cmp-in-page-nav__button"]');
        });

        // Checking for empty components
        const emptyComponents = await page.evaluate(() => {
            const emptyelements = [];
            const elements = document.querySelectorAll('.container responsivegrid content-width-1400--with-padding aem-GridColumn aem-GridColumn--default--12');
            elements.forEach(ele => {
                if (!ele.textContent.trim() && !ele.children.length) {
                    emptyComponents.push(ele);
                }
            });
            return emptyelements;
        });

        // Checking for breadcrumbs
        const breadcrumbs = await page.evaluate(() => {
            return !!document.querySelector(`div[class="cmp-breadcrumbs__container"]`);
        });

        // Checking for h1 tag
        const h1Tag = await page.evaluate(() => {
            return !!document.querySelector(`h1[class="cmp-title__text"]`);
        });

        // Execute JavaScript in the context of the page to get the empty tags with class names
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
            console.log("Empty tags  ", emptyTags);
            return emptyTags;
        });

        // Checking for promo container configured or not
        const promoComponent = await page.evaluate(() => {
            return !!document.querySelector(`div[class="cmp-promo-container__content aem-Grid aem-Grid--default--12 aem-Grid--tablet--12 aem-Grid--phone--12 cmp-promo-container-local__content"]`) || !!document.querySelector(`div[class="cmp-container__row cmp-container__row--offset-sm-top-bottom cmp-container__row--offset-lg-left-right aem-Grid aem-Grid--12 "]`);
        });

        let promoValid = [];
        if (promoComponent) {
            promoValid = await page.evaluate(() => {
                const promoContent = document.querySelectorAll(`div[class="promo cmp-promo--featured-primary rounded-corners-1 box-shadow dcom-theme1-2 aem-GridColumn aem-GridColumn--default--12"]`);

                if (promoContent) {
                    var promoCondition = [];
                    promoContent.forEach(promo => {
                        const h3Filled = promo.querySelector('h3.cmp-promo__content__title.element__primary span.dot-ellipsis.dot-lines-3');
                        const aTagHrefNotEmpty = promo.querySelector('a.cmp-promo-tracking.cmp-promo-curated');
                        const hasImage = promo.querySelector('div.cmp-promo__image.img-square.img-position-bottom');
                        const news = promo.querySelector('span.cmp-promo__content__type');
                        console.log("news ", news);
                        if ((h3Filled && h3Filled.textContent.trim() !== '') &&
                            (aTagHrefNotEmpty && aTagHrefNotEmpty.getAttribute('href').trim() !== '') && (hasImage !== null || news === "news")) {
                            promoCondition.push(true);
                        } else {
                            promoCondition.push(false);
                        }
                    });
                    return promoCondition;
                } else {
                    return [];
                }
            });
        }

        // Banner component checking
        const banner = await page.evaluate(() => {
            return !!document.querySelector(`div[class="cmp-cta__bg-img aem-GridColumn aem-GridColumn--default--12  cmp-scroll-top-margin"]`) || !!document.querySelector(`div[class="cmp-cta__bg-img aem-GridColumn aem-GridColumn--default--12"]`) || !!document.querySelector(`div[class="image image--hero no-padding-left-right aem-GridColumn aem-GridColumn--default--12"]`) || !!document.querySelector(`div[class="cmp-container-image aem-GridColumn aem-GridColumn--default--12"]`) ||
                !!document.querySelector(`div[class="cmp-video__full-screen no-padding aem-GridColumn aem-GridColumn--default--12   cmp-cta__bg-video "]`) || !!document.querySelector(`div[class="cta cta-v4 cmp-cta no-padding cmp-cta__bg-img cmp-cta__bg-img--hero cmp-cta__bg-gradient--light mb-10 mb-mob-5 aem-GridColumn aem-GridColumn--default--12"]`);
        });

        // Fetch all hyperlinks
        const hyperlinks = await page.evaluate(() => {
            const div = document.querySelector(`div[class="responsivegrid bodyresponsivegridcontainer aem-GridColumn aem-GridColumn--default--12"]`);
            if (div) {
                let collection_links = Array.from(div.querySelectorAll('a')).map(a => a.href).filter(link => !link.startsWith('mailto:') && !link.startsWith("whatsapp://send") && !link.startsWith("tel:") && !link.startsWith("javascript:"));
                collection_links = collection_links.map(link => {
                    if (link.includes('.html')) {
                        return link.split('.html')[0] + '.html';
                    }
                    if (link.includes('.pdf')) {
                        return link.split('.pdf')[0] + '.pdf';
                    }
                    return link;
                });
                return [...new Set(collection_links)];
            } else {
                let collection_links = Array.from(div.querySelectorAll('a')).map(a => a.href).filter(link => !link.startsWith('mailto:') && !link.startsWith("whatsapp://send") && !link.startsWith("tel:") && !link.startsWith("javascript:"));
                collection_links = collection_links.map(link => link.split('.html')[0] + '.html');
                return collection_links;
            }
        });

        // Function to check the status of links with exponential backoff
        async function checkLinks(links) {
            const checkedLinks = await Promise.all(links.map(async (link) => {
                let attempts = 0;
                const maxAttempts = 3;
                const delay = (attempt) => new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000)); // Exponential backoff

                while (attempts < maxAttempts) {
                    try {
                        const page = await browser.newPage(); // Create a new page for each link
                        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');
                        await page.setRequestInterception(true);
                        page.on('request', (request) => {
                            if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
                                request.abort();
                            } else {
                                request.continue();
                            }
                        });

                        const response = await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 }); // Wait for DOM content to load
                        console.log(`Link: ${link}, Status: ${response.status()}`);
                        await page.close(); // Close the page after checking the link
                        return { link, status: response.status() };
                    } catch (error) {
                        console.log(`Error loading link: ${link}, Attempt: ${attempts + 1}, Error: ${error.message}`);
                        attempts++;
                        if (attempts >= maxAttempts) {
                            //return { link, status: `Error after ${maxAttempts} attempts, Error: ${error.message}` };
                            return { link, status: `Error after ${maxAttempts} attempts` };
                        }
                        await delay(attempts); // Exponential backoff
                    }
                }
            }));
            return checkedLinks;
        }

        // Check the status of each hyperlink
        const checkedLinks = await checkLinks(hyperlinks);

        // Combine both sets of data into one object
        const result = {
            dataLayerAttributes: myproperty,
            ogMetaTags: ogMetaTags,
            inPageNav: inPageNav,
            emptyELements: emptyComponents,
            breadcrumbs: breadcrumbs,
            h1Tag: h1Tag,
            emptyTags: emptyTags,
            promoComponent: promoValid,
            bannerImage: banner,
            hyperlinks: checkedLinks
        };

        await browser.close();
        return result;

    }
    else{
        return null;
    }

    
}

appExpress.listen(8080, () => {
    console.log("Express server is running on port 8080");
    console.log("Please open http://localhost:8080/");
});
