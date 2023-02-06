import initiateScrape from './shoeScrape'
import initiateHardwareScrape from './hardwareScrape'

const PORT = 8000
import express from 'express'
import chalk from 'chalk'

const button = document.querySelector('.glowing-btn');

function initiateSequence() {
    const app = express()
    var server = app.listen(PORT, async function () {
        console.log(`server running on port ${PORT} `)
        initiateScrape()
        initiateHardwareScrape()
    })
}

button.addEventListener('click', initiateScrape)


// const app = express()
// var server = app.listen(PORT, async function () {
//     console.log(`server running on port ${PORT} `)
//     initiateScrape()
//     initiateHardwareScrape()
// })

// button.addEventListener("click", initiateSequence())





