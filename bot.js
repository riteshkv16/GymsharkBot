const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const locateChrome = require("chrome-location");
puppeteer.use(StealthPlugin());

const prompt = require("prompt-sync")();


async function payment(page){

    await page.waitForSelector("iframe[title='Field container for: Card number']")
    await page.waitForTimeout(2000)

    let iframe = await page.$("iframe[title='Field container for: Card number']")
    let iframeElement = await iframe.contentFrame()
    await iframeElement.type("input[id='number']", '4485575368385610')

    iframe = await page.$("iframe[title='Field container for: Name on card']")
    iframeElement = await iframe.contentFrame()
    await iframeElement.type("input[id='name']", 'Ritesh Verma')

    iframe = await page.$("iframe[title='Field container for: Expiration date (MM / YY)']")
    iframeElement = await iframe.contentFrame()
    await iframeElement.type("input[id='expiry']", '10/25')

    iframe = await page.$("iframe[title='Field container for: Security code']")
    iframeElement = await iframe.contentFrame()
    await iframeElement.type("input[id='verification_value']", '820')
    
    await page.waitForTimeout(1500)
    await page.evaluate(() => document.getElementById('continue_button').click()); //last step

}

async function checkout(page){

    //await page.goto("https://us.checkout.gymshark.com/1566146/checkouts/d3b92d213975b80b2da4f7e3f4e03296")
    await page.evaluate(() => {
        document.querySelector("a[data-locator-id='miniBag-checkout-select']").click()
    })

    await page.waitForSelector("#checkout_shipping_address_province")
    await page.waitForTimeout(1500)
    
        

    await page.evaluate(() => {
        document.getElementById('checkout_email').value = "rvbusiness1m@gmail.com"
        document.getElementById('checkout_shipping_address_first_name').value = "Ritesh"
        document.getElementById('checkout_shipping_address_last_name').value = "Verma"
        document.getElementById('checkout_shipping_address_address1').value = "8204 Baltimore Avenue"
        document.getElementById('checkout_shipping_address_city').value = "College Park"
        document.getElementById('checkout_shipping_address_zip').value = "20740"
        document.getElementById('checkout_shipping_address_phone').value = "4437645721"

        document.getElementById('checkout_shipping_address_province').value='MD'
    })

    await page.waitForTimeout(1500)
    await page.evaluate(() => document.getElementById('continue_button').click());
    
    await page.waitForTimeout(1500)
    await page.waitForSelector("#continue_button")
    await page.evaluate(() => document.getElementById('continue_button').click());

    await payment(page)
}

async function monitor(page, targetColor, targetSize){
    await page.goto("https://www.gymshark.com/products/gymshark-arrival-5-shorts-black-ss22");
    await page.waitForTimeout(2000);

    await page.evaluate((targetColor) => {
        let available = false
        let links = document.querySelectorAll("a[class]")
        let shortLinks = []
        let flag = false
        for(let i=0; i < links.length; i++){
            if (links[i].href.indexOf("arrival-5-shorts") > -1){
                shortLinks.push(links[i]) //collection of <a> that correspond to shorts
            }
        }

        for(let i = 0; i <  shortLinks.length; i++){
            console.log(shortLinks[i].href.indexOf(targetColor) > -1)
            if(shortLinks[i].href.toLowerCase().indexOf(targetColor) > -1){
                shortLinks[i].click()
                break
            }
        }
    }, targetColor)

    await page.waitForTimeout(1500)

    let isAvailable = await page.evaluate((targetSize) => {

        let sizes = document.querySelectorAll("button[class='size_size__zRXlq']")
        let available = false
        console.log(sizes)
        for(let i = 0; i < sizes.length; i++){
            console.log(sizes[i].innerText.toLowerCase() )
            if(sizes[i].innerText.toLowerCase() == targetSize){
                available = true
                sizes[i].click()
                break
            }
        }

        return available

    }, targetSize)

    await page.waitForTimeout(1500)

    if(isAvailable){
        await page.evaluate(() => {
            document.querySelector("i[class='icon-tick']").click()
        })
        await page.waitForTimeout(1000)
        return true
    }

    return false
    
}

async function run(){
    const browser = await puppeteer.launch({headless: false, executablePath: locateChrome})
    const page = await browser.newPage();

    let targetColor = prompt("What color shorts are you targeting: ")
    targetColor = targetColor.trim().toLowerCase()
    let targetSize = prompt("What size are you targeting: ")
    targetSize = targetSize.trim().toLowerCase()


    while(true){
        let isAvailable = await monitor(page, targetColor, targetSize)
        if(isAvailable){
            await page.waitForTimeout(1500)
            await checkout(page)
            break
        } else {
            console.log("Product not available.")
            await page.waitForTimeout(5000)
            await monitor(page)
        }
    }
    

}

run()