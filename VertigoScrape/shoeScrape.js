import axios from 'axios';
import { load } from 'cheerio';
import { green, blue, magenta } from 'chalk';
import { parseDocument } from 'htmlparser2';
import { write } from 'fast-csv';
import { createWriteStream } from "fs";

let currentDate = new Date().toJSON().slice(0, 10);
const start = Date.now()
const filename = `ShoeData(${currentDate}).csv`
const writableFile = createWriteStream(filename);

// international stores
let sportivaData = []
let salewaData = []
let evolData = []
let scarpaData = []
let madrockData = []

//local stores
const HEADER = [{
    name : 'Product',
    currency : 'Currency',
    price : 'Price',
    brand : 'Brand',
    catagory : 'Catagory',
    sex : 'Gender',
    location : 'Location',
    supplier : 'Supplier',
}]
let adventureInc = []
let mmoData = []
let driftersData = []
let ramData = []
let togData = []

let pageLimit = 10
let pageCounter = 1
let checkFemale = true

// THE EVOLV METHOD
function scrapeEvolv(url, shoeType) {

    axios(url).then(response => {
            const html = parseDocument(response.data)
            const $ = load(html)
                
            $('div[data-oa-analytics-content]', html).each(function() {
                
                const jsonText = $(this).attr('data-oa-analytics-content')
                const rawData= JSON.parse(jsonText)
                const shoes = rawData['ecommerce']
                
                if (shoes?.impressions) {

                    const shoeData = shoes.impressions.map(row => ({
                        name: row.name,
                        currency : '€',
                        price: (row.price).toString().replace(',', '.'),
                        brand: 'Evolv',
                        catagory : shoeType,
                        sex :null,
                        location: 'International',
                        supplier: 'EvolSports',
                    }))

                    evolData.push(shoeData)
                }    
            })

        }).catch(err => console.log(err))
   
        if (shoeType == 'Climbing Shoes' ) {

            scrapeEvolv('https://www.evolvsports.com/int/street-shoes','Approach Shoes')
        }
        return 
}

// -------------------------------------------------------------------------------------------- //

//THE SCARPA METHOD 

function scrapeScarpa(url , shoeType) {

    axios(url).then(response => {
            const html = parseDocument(response.data)
            const $ = load(html)
            
            $('.product_preview_inner', html).each(function() {

                let shoeName = $(this).find('h4').text()
                let shoePrice = $(this).find('span').text()
                let sex = 'Unisex'

                if (/WOMAN|WMN/.test(shoeName) || shoeName.slice(-1) == 'W') {
                    sex = 'Woman'
                }
                else {
                    sex = 'Man'
                }
                scarpaData.push({
                    name :  shoeName,
                    currency : '€',
                    price : shoePrice.replace('€', '').replace(',', '.').trim(),
                    brand : 'Scarpa',
                    catagory: shoeType,
                    sex :sex,
                    location: 'International',
                    supplier: 'Scarpa',
                })
            })
        }).catch(err => console.log(err))

        if (shoeType == 'Climbing Shoes' ) {
            scrapeScarpa('https://world.scarpa.com/approach-shoe.html', 'Approach Shoes')
        }
        return
}

//------------------------------------------------------------------------------------------------//

//THE MADROCK METHOD 

function scrapeMadRock(url) {

    axios(url).then(response => {
            const html = parseDocument(response.data)
            const $ = load(html)
     
            $('.product-info', html).each(function() {
                
                madrockData.push({
                    name :  $(this).find('.black').text(),
                    currency : '€',
                    price : $(this).find('bdi').text().replaceAll(',', '.').split('€')[1],
                    brand : 'MadRock',
                    catagory: 'Climbing Shoes',
                    sex: 'Unisex',
                    location: 'International',
                    supplier: 'Mad Rock',
                }) 
            })

        }).catch(err => console.log(err))
        return
}

//------------------------------------------------------------------------------------------------//

//THE SALEWA METHOD

function scrapeSalewa(url, sex) {

    axios(url).then(response => {

            const html = parseDocument(response.data)
            const $ = load(html)

           $('.listing--content', html).each(function() {

                const jsonText = $(this).attr('data-oa-analytics-content')
                const rawData= JSON.parse(jsonText)
                const shoes = rawData['ecommerce']

                    if (shoes?.impressions) {

                        const shoeData = shoes.impressions.map(row => ({
                            name: row.name,
                            currency : '€',
                            price: (row.price).toString().replace(',', '.'),
                            brand: 'Salewa',
                            catagory : row.category,
                            sex :sex,
                            location: 'International',
                            supplier: 'Salewa',
                        }))
                        salewaData.push(shoeData)
                    }
            })
    }).catch(err => console.log(err))

    if (sex == 'Man' ) {

        scrapeSalewa('https://www.salewa.com/women-footwear?p=1','Woman')
    }
    return 
}

//------------------------------------------------------------------------------------------------//


//LA SPORTIVA METHOD 

function scrapeSportiva(url, sex) {

    axios(url).then(response => {
            const html = parseDocument(response.data)
            const $ = load(html)
            var nextPageUrl = ''
            var counter = 0
            
            $('.product-item-info', html).each(function() {

                shoeCatagory  = $(this).find('span').text().split('\n')
                captureCatagory = ''
                counter = 0
                
                while (counter < shoeCatagory.length) {
                    if (/[a-zA-Z]/.test(shoeCatagory[counter])) {
                        if (!shoeCatagory[counter].includes("new")) {
                            captureCatagory = shoeCatagory[counter].trim()
                            counter = shoeCatagory.length
                        }
                    }
                    counter ++
                }
                sportivaData.push({
                    name :  $(this).find('.product-item-link').text().trim(),
                    currency : '€',
                    price : $(this).find('.price').text().replace('€',''),
                    brand : 'La Sportiva',
                    catagory: captureCatagory,
                    sex : sex,
                    location: 'International',
                    supplier: 'La Sportiva',
                })
                
            })

            //checking for multiple pages 
            if ($('.pages-item-next')) {
                nextPageUrl = $('.pages-item-next').find('a').attr('href')
                pageCounter++
            }

            if (pageCounter === pageLimit) {

                if (checkFemale == true) {
                    pageLimit = 8
                    pageCounter = 1
                    checkFemale = false
                    scrapeSportiva('https://www.lasportiva.com/en/woman/footwear', 'Woman')
                }
                else {
                    compileShoeData()
                    return
                }   
            }
            else {
                scrapeSportiva(nextPageUrl,sex)
            }

        }).catch(err => console.log(err))
        return
}

//------------------------------------------------------------------------------------------------//

//DRIFTERS METHOD 

function scrapeDrifters(url, shoeType, assignedCatagory) {

    axios(url).then(response => {

            const html = parseDocument(response.data)
            const $ = load(html)
           

           $('.product-details', html).each(function() {

                shoeName = $(this).find('.title').text()
                price = $(this).find('.current_price').text()
                let sex = 'Unisex'
                let brand = null
                let shoeCatagory = null
                
                if (!price) {
                    price = 'Sold Out'
                }
                 
                //sex
                if (!assignedCatagory) {
                    if (/Women's|Woman's|Womens|Woman|Women|Woman|Lady|WMS|Wmn’s|W’s|WMNS/.test(shoeName) || shoeName.slice(-1) == 'W') {
                        sex = 'Woman'
                    } if (/Men's|Men|Man|M’s/.test(shoeName) || shoeName.slice(-1) == 'M') {
                        sex = 'Man'
                    }
                } else {
                    sex = assignedCatagory
                }
          
                // brand
                if (!brand) {
                    if (/BOREAL|Boreal/.test(shoeName)) {
                        brand = 'Boreal'
                    } else if (/SCARPA|Scarpa|Vapor/.test(shoeName)) {
                        brand = 'Scarpa'
                    } else if (/La Sportiva/.test(shoeName)) {
                        brand = 'La Sportiva'
                    } else if (/Black Diamond/.test(shoeName)) {
                        brand = 'Black Diamond'
                    } else if (/Mad Rock/.test(shoeName)) {
                        brand = 'Mad Rock'
                    } else if (/Inov8/.test(shoeName)) {
                        brand = 'Inov8'
                    } else if (/Inov8/.test(shoeName)) {
                        brand = 'Inov8'
                    } else if (/Altra/.test(shoeName)) {
                        brand = 'Altra'
                    } else if (/Jim Green/.test(shoeName)) {
                        brand = 'Jim Green'
                        shoeCatagory= 'Ranger & Work Boots'
                    } else if (/Salomon/.test(shoeName)) {
                        brand = 'Salomon'
                    } else if (/Spenco/.test(shoeName)) {
                        brand = 'Spenco'
                    } else if (/Gumbies/.test(shoeName)) {
                        brand = 'Gumbies'
                        shoeCatagory = 'Flip Flops'
                    } else if (/Salewa/.test(shoeName)) {
                        brand = 'Salewa'
                    } else if (/Sofsole/.test(shoeName)) {
                        brand = 'Sofsole'
                    } else if (/The North Face/.test(shoeName)) {
                        brand = 'The North Face'
                    } else if (/Little Hotties/.test(shoeName)) {
                        brand = 'Little Hotties'
                    } else if (/Zamberlan/.test(shoeName)) {
                        brand = 'Zamberlan'
                    }

                }

                //shoeType
                if (!shoeType) {
                    if (/GTX|Hike|Zamberlan|The North Face|Alp Mate|HD|Ordesa/.test(shoeName)){
                        shoeCatagory = 'Hiking Shoes'
                    } else if (/Inov8|Altra|Trail Running|Supercross|Ultra 4|XA Wild|Madcross/.test(shoeName)) {
                        shoeCatagory = 'Trail Running Shoes'
                    } else if (/Approach Shoe|Drom|Approach|Technician Leather|Prime|Circuit|Mission LT|Session/.test(shoeName)) {
                    shoeCatagory = 'Approach Shoes'
                    } else if (/Trango|Mons Evo|Baruntse|G1/.test(shoeName)) {
                        shoeCatagory = 'Alpine & Expedition'
                    } else if (/Sandals/.test(shoeName)) {
                        shoeCatagory = 'Sandals'
                    } else  {
                        shoeCatagory = 'Shoe Accessories'
                    }
                } else {
                    shoeCatagory = shoeType
                }


                driftersData.push({
                    name :  shoeName.replace(/Rock Climbing Shoes|Climbing Shoes|Trail|Running|running|Approach Shoe|Approach Shoes|Boreal|SCARPA|La Sportiva|Black Diamond|Mad Rock|Men's|Women's|Inov8|Altra|Jim Green|Salomon|Spenco|Gumbies|Salewa|Sofsole|The North Face|Little Hotties|Zamberlan|Shoe|Shoes/g,'').trim(),
                    currency : 'ZAR',
                    price : price.replace('R','').replace('from','').replace(',','').trim(),
                    brand : brand,
                    catagory: shoeCatagory,
                    sex : sex,
                    location: 'Local',
                    supplier: 'Drifters',
                })
            })

    }).catch(err => console.log(err))

    if (shoeType == 'Climbing Shoes' ) {
        scrapeDrifters('https://www.driftersshop.co.za/collections/mens-footwear',null, 'Man')
    } else if (assignedCatagory == 'Man') {
        scrapeDrifters('https://www.driftersshop.co.za/collections/womens-footwear',null,'Woman')
    }
    return 
}

//------------------------------------------------------------------------------------------------//

//TRAVERSEGEAR (TOG) METHOD

function scrapeTOG(url) {

    axios(url).then(response => {

            const html = parseDocument(response.data)
            const $ = load(html)
           

           $('.woocommerce-LoopProduct-link', html).each(function() {

                let shoeName = $(this).find('.woocommerce-loop-product__title').text().replace(/Climbing Shoes|Climb Shoes|Approach Shoes/, '').replace('Shoes','')
                let price = $(this).find('bdi').text().replace(',', '').replace('R','')
                let sex = 'Unisex'
                let brand = null
                let shoeType = null
                          
                //sex
                if (/Women's|Woman's|Womens|Woman|Women|Woman|Lady|WMS|Wmn’s|W’s|WMNS/.test(shoeName) || shoeName.slice(-1) == 'W') {
                    sex = 'Woman'
                }
                if (/Men's|Men|Man|M’s/.test(shoeName) || shoeName.slice(-1) == 'M') {
                    sex = 'Man'
                }

                //brand
                if (!brand) {
                    if (/BOREAL|Boreal/.test(shoeName)) {
                        brand = 'Boreal'
                    } else if (/SCARPA|Scarpa|Vapor/.test(shoeName)) {
                        brand = 'Scarpa'
                    }
                }

                //shoeType
                if (!shoeType) {
                    if (/Golden|Spin|Ribelle/.test(shoeName)) {
                        shoeType = 'Running Shoes'
                    } else if (/Mojito/.test(shoeName)) {
                        shoeType = ['Mountain & Casual']
                    } else if (/Gecko|Approach Shoe|Mescalito|MESCALITO/.test(shoeName)) {
                        shoeType = 'Approach Shoes'
                    } else if (/GTX|Ribelle HD|HD|Drom|Ordesa|ZANSKAR|G1/.test(shoeName)){
                        shoeType = 'Hiking Shoes'
                    } else if (/LACES|FOOTBED|Laces|Footbed/.test(shoeName)) {
                        shoeType = ' Shoe Accessories'
                    } else {
                        shoeType = 'Climbing Shoes'
                    }
                }


                togData.push({
                    name :  shoeName,
                    currency : 'ZAR',
                    price : price,
                    brand : brand,
                    catagory: shoeType,
                    sex : sex,
                    location: 'Local',
                    supplier: 'TraverseGear',
                })
                brand = null
                shoeType = null
            })

    }).catch(err => console.log(err))

    return 
}

//------------------------------------------------------------------------------------------------//

//RAM METHOD

function scrapeRam(url, shoeType) {

    axios(url).then(response => {

            const html = parseDocument(response.data)
            const $ = load(html)
           

           $('.woocommerce-LoopProduct-link', html).each(function() {

                let shoeName = $(this).find('.woocommerce-loop-product__title').text().replace(/Climbing Shoes|Climb Shoes|Approach Shoes/, '').replace('Shoes','')
                let price = $(this).find('bdi').text().replace(',', '').replace('R','')
                let sex = 'Unisex'
                          
                //sex
                if (/Women's|Woman's|Womens|Woman|Women|Woman|Lady|WMS|Wmn’s|W’s/.test(shoeName)) {
                    sex = 'Woman'
                }
                if (/Men's|Men|Man|M’s/.test(shoeName)) {
                    sex = 'Man'
                }

                ramData.push({
                    name :  shoeName,
                    currency : 'ZAR',
                    price : price,
                    brand : 'Black Diamond',
                    catagory: shoeType,
                    sex : sex,
                    location: 'Local',
                    supplier: 'RAM',
                })
            })

    }).catch(err => console.log(err))

    if (shoeType == 'Climbing Shoes' ) {
        scrapeRam('https://blackdiamondequipment.co.za/product-category/approach-shoes/', 'Approach Shoes' )
    } else if (shoeType == 'Approach Shoes') {
        scrapeRam('https://blackdiamondequipment.co.za/product-category/performance-footwear-m-w/street-shoes/','Street Shoes')
    }
    
    return 
}

//------------------------------------------------------------------------------------------------//

//MMO METHOD

function scrapeMMO(url, shoeType) {

    axios(url).then(response => {

            const html = parseDocument(response.data)
            const $ = load(html)
           

           $('.product', html).each(function() {

                let brand = $(this).find('.brand').text().replace('\n', '')
                let shoeName = $(this).find('.card-title').text().replace(brand, '').replace('-', ' ').trim()
                let price = $(this).find('.price--withoutTax').text().replace('R', '').replace(',','')
                let sex = 'Unisex'

                if (shoeName === "") {
                    return
                }
                //shoe type
                if (!shoeType) {
                    if (/Approach Shoe/.test(shoeName)) {
                        shoeType = 'Approach Shoes'
                    } else if (/Hiking|GTX|Boreal/.test(shoeName)) {
                        shoeType = 'Hiking Shoes'
                    } else {
                        shoeType = 'Mountain'
                    }
                }
                
                //sex
                if (/Women's|Woman's|Womens|Woman|Women|Woman|Boreal|Lady|WMS|W’s/.test(shoeName)) {
                    sex = 'Woman'
                }
                if (/Men's|Men|Man/.test(shoeName)) {
                    sex = 'Man'
                }

                mmoData.push({
                    name :  shoeName.replace('Approach Shoe ', ''),
                    currency : 'ZAR',
                    price : price,
                    brand : brand,
                    catagory: shoeType,
                    sex : sex,
                    location: 'Local',
                    supplier: 'MMO',
                })
                if (shoeType != 'Climbing Shoes' || shoeType != 'Alpine & Expedition')   {
                    shoeType = null
                }
            })

    }).catch(err => console.log(err))

    if (shoeType == 'Climbing Shoes' ) {
        scrapeMMO('https://www.mountainmailorder.co.za/footwear/alpine-and-expedition/', 'Alpine & Expedition' )
    } else if (shoeType == 'Alpine & Expedition') {
        scrapeMMO('https://www.mountainmailorder.co.za/footwear/hiking-and-approach/',null)
    }
    
    return 
}

//------------------------------------------------------------------------------------------------//

//ADVENTURE INC 

function scrapeAdventureInc(url, shoeType) {

    axios(url).then(response => {

            const html = parseDocument(response.data)
            const $ = load(html)
            let sex

           $('.woo-entry-inner', html).each(function() {

                const scrappyText = $(this).text().split('\n')

                sex = getSex(scrappyText[4])
              
               
                adventureInc.push({
                    name :  scrappyText[4].substring(21).replace('Running ', ''),
                    currency : 'ZAR',
                    price : scrappyText[5].replace('\tR', '').replace(',', ''),
                    brand : 'La Sportiva',
                    catagory: shoeType,
                    sex : sex,
                    location: 'Local',
                    supplier: 'Adventure Inc',
                })
            })

    }).catch(err => console.log(err))
 
    if (shoeType == 'Climbing Shoes' ) {
        scrapeAdventureInc('https://www.adventureinc.co.za/product-category/la-sportiva/approach-footwear-la-sportiva/?products-per-page=all','Approach Shoes')
    }
    if (shoeType == 'Approach Shoes' ) {
        scrapeAdventureInc('https://www.adventureinc.co.za/product-category/la-sportiva/mountain-running-footwear/?products-per-page=all','Mountain Running')
    }
    return 
}

//------------------------------------------------------------------------------------------------//

function getSex(shoeName) {

    let sex = 'Unisex'

    if (/Women's|Woman's|Womens|Woman|Women|Woman|Lady|WMS|Wmn’s|W’s|WMNS/.test(shoeName) || shoeName.slice(-1) == 'W') {
        sex = 'Woman'
    }
    if (/Men's|Men|Man|M’s/.test(shoeName) || shoeName.slice(-1) == 'M') {
        sex = 'Man'
    }
    return sex

}


//------------------------------------------------------------------------------------------------//

// COMPILE DATA

function compileShoeData() {

    const shoeList = HEADER.concat(sportivaData,driftersData,mmoData,togData,ramData,adventureInc, evolData[0],evolData[1], scarpaData,madrockData, salewaData[0], salewaData[1])
    // shoeCSV = convertToCSV(shoeList)
    write(shoeList).pipe(writableFile)
    console.log(green.bold(` Shoe CSV has been successfully generated`))
    const end = Date.now()
    let time = (end - start)/1000
    console.log(blue.bold(`Execution time: ${time} seconds`))

}
//------------------------------------------------------------------------------------------------//

//GENERATE CSV 
 
// function convertToCSV(shoeData) {

//     const objArray = JSON.stringify(shoeData);
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
 
async function initiateScrape() {


    console.log(blue.bold(`Scrape sequence initialized ...`))

    //scraping local domains
    console.log(green.bold(`Scraping Local Domains`))

    console.log(magenta(`Scraping: Adventure Inc Shoes`))
    scrapeAdventureInc('https://www.adventureinc.co.za/product-category/la-sportiva/climbing-footwear/?products-per-page=all','Climbing Shoes')

    console.log(magenta(`Scraping: MMO Shoes`))
    scrapeMMO('https://www.mountainmailorder.co.za/footwear/climbing-shoes/','Climbing Shoes')

    console.log(magenta(`Scraping: RAM Shoes`))
    scrapeRam('https://blackdiamondequipment.co.za/product-category/rock/climbing-shoes/','Climbing Shoes')

    console.log(magenta(`Scraping: TraverseGear Shoes`))
    scrapeTOG('https://traversegear.co.za/product-category/footwear/')

    console.log(magenta(`Scraping: Drifters Shoes`))
    scrapeDrifters('https://www.driftersshop.co.za/collections/climbing-footwear','Climbing Shoes',null)


    // scraping international domains 
    console.log(green.bold(`Scraping International Domains`))

    console.log(magenta(`Scraping: Evolv Shoes`))
    scrapeEvolv('https://www.evolvsports.com/int/climbing-shoes', 'Climbing Shoes')

    console.log(magenta(`Scraping: Scarpa Shoes`))
    scrapeScarpa('https://world.scarpa.com/shop/category/19267839/', 'Climbing Shoes')

    console.log(magenta(`Scraping: Mad Rock Shoes`))
    scrapeMadRock('https://madrock.eu/product-category/shoes/?number=24')

    console.log(magenta(`Scraping: La Sportiva Shoes`))
    scrapeSportiva('https://www.lasportiva.com/en/man/footwear', 'Man')

    console.log(magenta(`Scraping: Salewa Shoes`))
    scrapeSalewa('https://www.salewa.com/men-mountain-footwear?p=1', 'Man')

    return
}

export default initiateScrape