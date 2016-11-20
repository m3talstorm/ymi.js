'use strict'

// Native
const EventEmitter = require('events').EventEmitter;

// 3rd-Party
const _ = require('lodash');
const OAuth2 = require('googleapis').auth.OAuth2;
const Youtube = require('googleapis').youtube('v3');

// Proprietary



class Client extends EventEmitter{

    constructor(config) {

        super()

        // Create a defult config
        this.config = _.extend({

            oauth : {
                client_id: null,
                client_secret: null,
                redirect_uri: null,

                access_token: null,
                refresh_token: null,
                token_expiry: null,
            },
            live_chat_id: null,
            // Polling interval in ms
            interval : null,
            // The page_token to start from
            page_token: null,

        }, config)
        //
        this.client = null

        this.poll_handle = null
    }

    connect() {

        this.emit('connecting')

        var oauth = this.config.oauth;

        this.client = new OAuth2(oauth.client_id, oauth.client_secret, oauth.redirect_uri);

        this.client.setCredentials({
            access_token: oauth.access_token,
            refresh_token: oauth.refresh_token,
            expiry_token: oauth.expiry_token,
        });

        // Fire connected event
        this.emit('connected')
        // Start polling for chat messages
        this.poll();
    }
    // Disconnect the
    disconnect() {
        // TODO: Close the this.client?

        // Stop the polling
        clearTimeout(this.poll_handle);

        this.poll_handle = null;

        this.emit('disconnected')
    }

    say(message) {

        Youtube.liveChatMessages.insert({
            "part" : "snippet",
            "auth": this.client,
            "resource" : {
                "snippet": {
                    liveChatId: this.config.live_chat_id,
                    "type": "textMessageEvent",
                    "textMessageDetails" : {
                        "messageText"  : message
                    }
                }
            }
        });
    }
    // Ask Youtube for any new messages
    poll() {

        Youtube.liveChatMessages.list({
            part: 'snippet, authorDetails',
            liveChatId: this.config.live_chat_id,
            auth: this.client,
            pageToken : this.config.page_token,
            maxResults : 2000
        },
        this.parse.bind(this) );
    }
    // parse a youtube reponse
    parse(error, response) {

        if(error && error.errors)
        {
            var first = error.errors[0]

            switch(first.reason)
            {
                case 'authError':
                    this.refresh();
                break

                case 'rateLimitExceeded':
                    // Just continue
                break

                case 'liveChatDisabled':
                case 'liveChatNotFound':
                case 'forbidden':
                case 'liveChatEnded':
                default:
                    // Fire error event
                    this.emit('error', error)

                    return
            }
        }

        // Check that we got a valid response
        if(response) {
            // Fire chat events
            response.items.forEach((item, index) => {
                this.emit('chat', item.authorDetails, item.snippet)
            })
        }

        // Use the configured polling interval or what ever Youtube tells us to
        // If we got an error/no reponse then hold off for a little bit before we ask again
        const interval = response == undefined ? 10000 : Math.max(this.config.interval, response.pollingIntervalMillis);
        // Update the page token so we don't get the same messages over and over
         const page_token = response == undefined ? undefined : response.nextPageToken;
         // Check the page_token actually changed
        if(!(this.config.page_token == page_token))
        {
            this.config.page_token = page_token
            // Only tell listeners that the token changed if we got some new chat messages as well
            if(response && response.items.length) {
                // Tell listeners that the page token as changed
                this.emit('page_token', this.config.page_token)
            }
        }
        // Setup another poll
        this.poll_handle = setTimeout(this.poll.bind(this), interval);

    }
    // Refeshes the oauth token
    refresh() {

        this.client.refreshAccessToken((error, refresh_token) => {

            if(error) {
                this.emit('error', error)

                return                
            }
            // Update our local refresh token
            this.config.oauth.refresh_token = refresh_token
            // Fire a refresh event
            this.emit('refresh_token', refresh_token)
        });
    }

}

module.exports = Client
