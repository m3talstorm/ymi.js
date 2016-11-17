'use strict'

// Native
const fs = require('fs')

// 3rd-Party
const ymi = require('./index')

// Proprietary




const CONFIG_PATH = './youtube.provider.json'

let buffer = null

try {
    buffer = fs.readFileSync(CONFIG_PATH)
}
catch (error) {
    throw "No youtube.provider.json found"
}

const config = buffer ? JSON.parse(buffer) : {};

const client = new ymi.client({
    oauth: config.oauth,
    live_chat_id: config.live_chat_id,
    page_token: config.page_token,
})

client.on('connected', () => {
    console.log("connected")
})

client.on('chat', (user, message) => {
    console.log(user.displayName, message.displayMessage)
})

client.on('page_token', (page_token) => {
    // Update config with the new page token
    config.page_token = page_token
    // Persist config to disk
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
})

client.on('refresh_token', (refresh_token) => {
    // Update config with the new refresh token
    config.oauth.refresh_token = refresh_token
    // Persist config to disk
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
})

client.connect()
