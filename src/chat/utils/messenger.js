const request = require('request');
const axios = require('axios');
const LLM = require('../../models/GPT');
const db = require('../../db/pouch');
const functions = require('../../models/functions/functions')
const falcon = require('../../models/utils/falcon')

let model = 'gpt-3.5-turbo-16k-0613'


async function handleMessage(sender_psid, received_message) {
    let conversationHistory = await db.retrieveHistory(sender_psid);
    let userInfo = await db.getUserInfo(sender_psid);
    let response;
    let textResponse;
    senderAction(sender_psid, 'mark_seen');
    // Check if the message contains text
    if (received_message.text) {
        senderAction(sender_psid, 'typing_on');
        try {
            const jsonResponse = await falcon.completion(received_message.text,userInfo,conversationHistory); // Pass the text property
            console.log("jsonResponse:", jsonResponse);
            textResponse = jsonResponse.text; // Assuming the text property contains the response
            db.storeHistory({ usr: received_message.text, bot: textResponse }, sender_psid);

            senderAction(sender_psid, 'typing_off');
            // db.storeHistory({ usr: received_message.text, bot: textResponse }, sender_psid);
            callSendAPI(sender_psid, { text: textResponse });
        } catch (error) {
            console.error("Error:", error);
            // Handle the error as needed
        }}else if (received_message.attachments) {
        let attachment_url = received_message.attachments[0].payload.url;
        fetch("https://ybelkada-blip-api.hf.space/run/predict", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    data: [
      attachment_url,
	]
  })})
.then(r => r.json())
.then(
  r => {
    let data = r.data[0];
    db.storeHistory({ usr: `uploaded image of ${data}`, bot: textResponse }, sender_psid);
  }
)
        console.log(attachment_url)
    }
}

function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'RESET') {
        db.deleteEntriesForUser(sender_psid);
        response = { text: 'History Reset!' };
    } else if (payload === 'SWITCH') {
        if (model === 'gpt-3.5-turbo-16k-0613') {
            model = 'gpt-4';
        } else {
            model = 'gpt-3.5-turbo-16k-0613';
        }
        response = { text: `Model switched to ${model}` };
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
