import axios from 'axios';
import { load } from 'cheerio';
import { green, blue, magenta } from 'chalk';
import { parseDocument } from 'htmlparser2';
import { write } from 'fast-csv';
import { createWriteStream } from "fs";

let currentDate = new Date().toJSON().slice(0, 10);
const start = Date.now()
const filename = `Hardware(${currentDate}).csv`
const writableFile = createWriteStream(filename);

const HEADER = [{
    name : 'Product',
    currency : 'Currency',
    price : 'Price',
    brand : 'Brand',
    catagory : 'Catagory',
    location : 'Location',
    supplier : 'Supplier',
}]
let driftersData = []
let ramData = []
let mmoData = []

function scrapeDrifters(url, storeCatagory) {

    axios(url).then(response => {

        const html = parseDocument(response.data)
        const $ = load(html)
       

       $('.product-details', html).each(function() {

            productName = $(this).find('.title').text()
            price = $(this).find('.current_price').text()
            let brand = null
            let catagory = null
            
            if (!price) {
                price = 'Sold Out'
            } if (!brand) {
                brand = getBrand(productName)
            } if (!catagory) {
                if (storeCatagory == 'Belay/Rappel') {
                    catagory = 'Belay/Rappel'
                } else {
                    catagory = getProductCatagory(productName)
                }
            }

            driftersData.push({
                name :  productName.replace(brand,'').trim(),
                currency : 'ZAR',
                price : price.replace('R','').replace('from','').replace(',','').trim(),
                brand : brand,
                catagory: catagory,
                location: 'Local',
                supplier: 'Drifters',
            })
        })


    }).catch(err => console.log(err))

    if (storeCatagory == 'Carabiners & Quickdraws' ) {
        scrapeDrifters('https://www.driftersshop.co.za/collections/ropes','Ropes')
    } else if (storeCatagory == 'Ropes') {
        scrapeDrifters('https://www.driftersshop.co.za/collections/belay-rappel','Belay/Rappel')
    }
    return 
}

function scrapeRam(url, storeCatagory) {
    
    axios(url).then(response => {

        const html = parseDocument(response.data)
        const $ = load(html)

       $('.woocommerce-LoopProduct-link', html).each(function() {

            let productName = $(this).find('.woocommerce-loop-product__title').text()
            let price = $(this).find('bdi').text().replace(',', '').replace('R','')
            let brand = null
            let catagory = null
         
            if (!price) {
                price = 'Sold Out'
            } if (!brand) {
                brand = getBrand(productName)
            } if (!catagory) {
                if (storeCatagory == 'Belay/Rappel') {
                    catagory = 'Belay/Rappel'
                } else {
                    catagory = getProductCatagory(productName)
                }
            }
        
            ramData.push({
                name :  productName.replace(brand,'').trim(),
                currency : 'ZAR',
                price : price,
                brand : brand,
                catagory: catagory,
                location: 'Local',
                supplier: 'RAM',
            })
        })

}).catch(err => console.log(err))

if (storeCatagory == 'Carabiners & Quickdraws' ) {
    scrapeRam('https://www.rammountain.co.za/cat/climbing/hardwear/','Belay/Rappel')
} else if (storeCatagory == 'Belay/Rappel' ) {
    scrapeRam('https://www.rammountain.co.za/cat/climbing/slings-software/','SLINGS & SOFTWARE')
}

return 
}

function scrapeMMO(url, storeCatagory) {

    axios(url).then(response => {

            const html = parseDocument(response.data)
            const $ = load(html)
           

           $('.product', html).each(function() {

                let brand = $(this).find('.brand').text().replace('\n', '')
                let productName = $(this).find('.card-title').text().replace(brand, '').replace('-', ' ').trim()
                let price = $(this).find('.price--withoutTax').text().replace('R', '').replace(',','')

                if (productName === "") {
                    return
                }
               
                mmoData.push({
                    name :  productName.replace(brand, ''),
                    currency : 'ZAR',
                    price : price.replace('R', ''),
                    brand : brand,
                    catagory: storeCatagory,
                    location: 'Local',
                    supplier: 'MMO',
                })
            })

    }).catch(err => console.log(err))

    if (storeCatagory == 'Carabiners' ) {
        scrapeMMO('https://www.mountainmailorder.co.za/climbing/quickdraws/', 'Quickdraws' )
    } else if (storeCatagory == 'Quickdraws') {
        scrapeMMO('https://www.mountainmailorder.co.za/climbing/belay-devices-and-accessories/belay-devices/','Belay/Rappel')
    } else if (storeCatagory == 'Belay/Rappel') {
        scrapeMMO('https://www.mountainmailorder.co.za/climbing/slings-and-cords/','Slings/Cords')
    } 

    return 
}

function getBrand(productName) {

    let brand = null

    if (/Black Diamond|BD/.test(productName)) {
        brand = 'Black Diamond'
    } else if (/Mad Rock/.test(productName)) {
        brand = 'Mad Rock'
    } else if (/Singing Rock/.test(productName)) {
        brand = 'Singing Rock'
    } else if (/Karam/.test(productName)) {
        brand = 'Karam'
    } else if (/Petzl/.test(productName)) {
        brand = 'Petzl'
    } else if (/Beal|BEAL/.test(productName)) {
        brand = 'Beal'
    } else if (/Salewa/.test(productName)) {
        brand = 'Salewa'
    } else if (/Coghlan's/.test(productName)) {
        brand = 'Coghlans'
    } else if (/Secur'em/.test(productName)) {
        brand = 'Secur\'em'
    } else if (/Maillon Rapide/.test(productName)) {
        brand = 'Maillon Rapide'
    }
    return brand
}

function getProductCatagory(productName) {

    let catagory = null

    if (/Antidote|Rando|Static|Karma|Diablo/.test(productName)) {
        catagory = 'Rope'
    } else if (/Accessory Cord/.test(productName)) {
        catagory = 'Accessory Cord'
    } else if (/Runner|Runners/.test(productName)) {
        catagory = 'Runner'
    } else if (/Paracord/.test(productName)) {
        catagory = 'Paracord'
    } else if (/Bag/.test(productName)) {
        catagory = 'Rope Bag'
    } else if (/Chain/.test(productName)) {
        catagory = 'Safety Chain'
    } else if (/Sling/.test(productName)) {
        catagory = 'Sling'
    } else if (/Accessory Cord/.test(productName)) {
        catagory = 'Accessory Cord'
    } else if (/Quick Draw|QuickDraw|Quickdraw|Express Set|Light Draw|Hotforge Hybrid|Vision Dyneema/.test(productName)) {
        catagory = 'Quickdraw'
    } else if (/Cheat Stick/.test(productName)) {
        catagory = 'Cheat Stick'
    } else if (/webbing|Webbing/.test(productName)) {
        catagory = 'Webbing'
    } else if (/Anchor System/.test(productName)) {
        catagory = 'Anchor System'
    } else if (/Etrier|Alpine Aider|Footer|Escaper/.test(productName)) {
        catagory = 'Ladder/Abseil'
    } else if (/Slackline/.test(productName)) {
        catagory = 'Slackline'
    } else {
        catagory = 'Carabiner'
    }

    return catagory
}

// COMPILE DATA

function compileData() {

    const hardwareList = HEADER.concat(mmoData,driftersData,ramData)
    write(hardwareList).pipe(writableFile)
    console.log(green.bold(`Hardware CSV has been successfully generated`))
    const end = Date.now()
    let time = (end - start)/1000
    console.log(blue.bold(`Execution time: ${time} seconds`))

}

//GENERATE CSV 
 
// function convertToCSV(productData) {

//     const objArray = JSON.stringify(productData);
//     var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
//     var str = '';

//     for (var i = 0; i < array.length; i++) {
//         var line = '';
//         for (var index in array[i]) {
//             if (line != '') line += ','

//             line += array[i][index];
//         }
//         str += line + '\r\n';
//     }
//     return str;
// }
 

async function initiateHardwareScrape() {

    //scraping local domains
    console.log(green.bold(`Scraping Local Domains`))

    console.log(magenta(`Scraping: MMO Hardware`))
    scrapeMMO('https://www.mountainmailorder.co.za/climbing/carabiners/','Carabiners')

    console.log(magenta(`Scraping: RAM Hardware`))
    scrapeRam('https://www.rammountain.co.za/cat/climbing/connectors/','Carabiners & Quickdraws')

    console.log(magenta(`Scraping: Drifters Hardware`))
    scrapeDrifters('https://www.driftersshop.co.za/collections/carabiners-quickdraws','Carabiners & Quickdraws')

    setTimeout(() => {  compileData() }, 5000);
}

export default initiateHardwareScrape