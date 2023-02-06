import initiateScrape from './shoeScrape'
import initiateHardwareScrape from './hardwareScrape'

const PORT = 8000
// const button = document.querySelector("#myButton");
import express from 'express'
import chalk from 'chalk'

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





