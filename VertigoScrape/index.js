const initiateScrape = require('./shoeScrape')
const initiateHardwareScrape = require('./hardwareScrape')

const PORT = 8000
// const button = document.querySelector("#myButton");
const express = require('express')
const chalk = require('chalk')

function initiateSequence() {
    const app = express()
    var server = app.listen(PORT, async function () {
        console.log(`server running on port ${PORT} `)
        initiateScrape()
        initiateHardwareScrape()
    })
}
// const app = express()
// var server = app.listen(PORT, async function () {
//     console.log(`server running on port ${PORT} `)
//     initiateScrape()
//     initiateHardwareScrape()
// })

// button.addEventListener("click", initiateSequence())





