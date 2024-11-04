const express = require('express');
const puppeteer = require('puppeteer-core'); // Use puppeteer-core for serverless
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
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Set the viewport size
        await page.setViewport({
            width: 1920,
            height: 880,
            deviceScaleFactor: 1,
        });

        await page.goto(pubURL, { waitUntil: 'domcontentloaded' });
        console.log("Page loaded - Ready to take screenshot");

        // Take a screenshot of the page
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        await browser.close();

        // Send the screenshot back to the client
        res.set('Content-Type', 'image/png');
        res.send(screenshotBuffer);
    } catch (error) {
        console.error("Error taking screenshot:", error);
        res.status(500).send("Error taking screenshot");
    }
});

appExpress.get('/sitemap', async (req, res) => {
    try {
        const sitemapUrl = 'https://www.deloitte.com/global/sitemaps/secured/sitemap_global_en.xml';
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
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');
    
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
        return dataLayer.page.attributes.pageTitle !== "404" ? dataLayer.page.attributes : null;
    });

    if (myproperty) {
        // Extracting necessary data from the page
        const result = {
            dataLayerAttributes: myproperty,
            ogMetaTags: await extractOgMetaTags(page),
            inPageNav: await checkInPageNav(page),
            emptyElements: await checkEmptyComponents(page),
            breadcrumbs: await checkBreadcrumbs(page),
            h1Tag: await checkH1Tag(page),
            emptyTags: await getEmptyTags(page),
            promoComponent: await checkPromoComponent(page),
            bannerImage: await checkBannerComponent(page),
            hyperlinks: await checkHyperlinks(page, browser)
        };

        await browser.close();
        return result;
    } else {
        await browser.close();
        return null;
    }
}

// Helper functions to modularize tasks
async function extractOgMetaTags(page) {
    return page.evaluate(() => {
        const metaTags = document.querySelectorAll('meta[property^="og:"]');
        return Array.from(metaTags).map(tag => ({
            property: tag.getAttribute('property'),
            content: tag.getAttribute('content')
        }));
    });
}

async function checkInPageNav(page) {
    return page.evaluate(() => {
        return !!document.querySelector('a[class="cmp-in-page-nav__button"]');
    });
}

async function checkEmptyComponents(page) {
    return page.evaluate(() => {
        const emptyElements = [];
        const elements = document.querySelectorAll('.container .responsivegrid .content-width-1400--with-padding .aem-GridColumn');
        elements.forEach(ele => {
            if (!ele.textContent.trim() && !ele.children.length) {
                emptyElements.push(ele);
            }
        });
        return emptyElements;
    });
}

async function checkBreadcrumbs(page) {
    return page.evaluate(() => {
        return !!document.querySelector(`div[class="cmp-breadcrumbs__container"]`);
    });
}

async function checkH1Tag(page) {
    return page.evaluate(() => {
        return !!document.querySelector(`h1[class="cmp-title__text"]`);
    });
}

async function getEmptyTags(page) {
    return page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const emptyTags = {};

        elements.forEach(element => {
            if (!element.innerHTML.trim() && element.classList.length > 0) {
                emptyTags[element.classList[0]] = element.outerHTML;
            }
        });
        return emptyTags;
    });
}

async function checkPromoComponent(page) {
    return page.evaluate(() => {
        return !!document.querySelector(`div[class="cmp-promo-container__content"]`) || 
               !!document.querySelector(`div[class="cmp-container__row"]`);
    });
}

async function checkBannerComponent(page) {
    return page.evaluate(() => {
        return !!document.querySelector(`div[class="cmp-cta__bg-img"]`) || 
               !!document.querySelector(`div[class="image image--hero"]`);
    });
}

async function checkHyperlinks(page, browser) {
    return page.evaluate(async () => {
        const div = document.querySelector(`div[class="responsivegrid bodyresponsivegridcontainer aem-GridColumn"]`);
        const links = div ? Array.from(div.querySelectorAll('a')).map(a => a.href) : [];
        
        return links.filter(link => !link.startsWith('mailto:') && !link.startsWith("whatsapp://send") && 
                                    !link.startsWith("tel:") && !link.startsWith("javascript:"));
    }).then(async links => {
        return checkLinks(links, browser);
    });
}

async function checkLinks(links, browser) {
    const checkedLinks = await Promise.all(links.map(async (link) => {
        let attempts = 0;
        const maxAttempts = 3;
        const delay = (attempt) => new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));

        while (attempts < maxAttempts) {
            try {
                const page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');
                await page.setRequestInterception(true);
                page.on('request', (request) => {
                    if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
                        request.abort();
                    } else {
                        request.continue();
                    }
                });

                const response = await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await page.close();
                return { link, status: response.status() };
            } catch (error) {
                attempts++;
                if (attempts >= maxAttempts) {
                    return { link, status: `Error after ${maxAttempts} attempts` };
                }
                await delay(attempts);
            }
        }
    }));
    return checkedLinks;
}

appExpress.listen(8080, () => {
    console.log("Express server is running on port 8080");
    console.log("Please open http://localhost:8080/");
});
