const request = require('request');
const axios = require('axios');
const LLM = require('../../models/GPT');
const db = require('../../db/pouch');

async function handleMessage(sender_psid, received_message) {
    let response;
        senderAction(sender_psid, 'mark_seen');
    // Check if the message contains text
    if (received_message.text) {
        senderAction(sender_psid, 'typing_on');
        response = await LLM.completions('gpt-3.5-turbo-0613', received_message, sender_psid);
        console.log('res', response);
        senderAction(sender_psid, 'typing_off');
        callSendAPI(sender_psid, response);
    } else if (received_message.attachments) {
        let attachment_url = received_message.attachments[0].payload.url;
        
       // callSendAPI(sender_psid, response);
    }
    
}

function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;
    

    // Set the response based on the postback payload
    if (payload === 'RESET') {
        db.deleteEntriesForUser(sender_psid)
        response = { text: 'History Reset!' };
    } else if (payload === 'no') {
        response = { text: 'Oops, try sending another image.' };
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

function senderAction(sender_psid, action) {
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

    const url = `https://graph.facebook.com/v2.6/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

    const requestData = {
        recipient: {
            id: sender_psid,
        },
        sender_action: action,
    };

    axios
        .post(url, requestData, {
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then((response) => {
            console.log('Sender Action:', action, 'to:', response.data.recipient_id);
        })
        .catch((error) => {
            console.error('Error sending message', error);
        });
}

function callSendAPI(sender_psid, response) {
    let request_body = {
        recipient: {
            id: sender_psid,
        },
        message: response,
    };

    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
    const API_URL = 'https://graph.facebook.com/v2.6/me/messages';

    const params = {
        access_token: PAGE_ACCESS_TOKEN,
    };

    axios
        .post(API_URL, request_body, { params })
        .then((response) => {
            console.log('Message sent.');
        })
        .catch((error) => {
            console.error('Unable to send message:', error);
        });
}

module.exports = {
    callSendAPI,
    handleMessage,
    handlePostback,
    senderAction,
};



