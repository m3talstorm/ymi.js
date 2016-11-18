# ymi.js

ymi.js is heavy influenced by the awesome [tmi.js](https://tmijs.org/) providing basic functionality to get a Youtube stream's chat messages from the Youtube API


## Install

#### Node

~~~ bash
npm install ymi.js --save
~~~

## Usage

#### Node

~~~ javascript

const ymi = require('ymi')

const config = {
    oauth : {
        client_id: "1394...apps.googleusercontent.com",
        client_secret: "-mHmFvwL...",
        access_token: "ya29...",
        refresh_token: "1/zz_dq0vjjWc..."
    },
    live_chat_id: 'EiEKGFV...',
    page_token: null,
}

const client = new ymi.client(config)

client.on('connected', () => {
    console.log("connected")
})

client.on('chat', (user, message) => {
    console.log(user.displayName, message.displayMessage)
})

client.on('page_token', (page_token) => {

    console.log("New page token", page_token)
    // TODO: Persist to disk
})

client.on('refresh_token', (refresh_token) => {

    console.log("New refresh token", refresh_token)
    // TODO: Persist to disk
})

client.connect()
// Send a message to the stream's chat
client.say("Test message")


~~~
