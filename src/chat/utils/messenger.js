const request = require('request');
const axios = require('axios');
const LLM = require('../../models/GPT');
const db = require('../../db/pouch');
const functions = require('../../models/functions/functions');
const falcon = require('../../models/utils/falcon');
const llama2 = require('../../models/mistral');
const translate = require('../../models/utils/test')

let model = 'gpt-3.5-turbo-16k-0613';

async function handleMessage(sender_psid, received_message) {
    let conversationHistory = await db.retrieveHistory(sender_psid);
    let userInfo = await db.getUserInfo(sender_psid);
    let response;
    let textResponse;
    
    // Check if the message contains text
    if (received_message.text) {
        senderAction(sender_psid, 'mark_seen');
        senderAction(sender_psid, 'typing_on');
        try {
            let jsonResponse
            let tralnsation;
            let lang = await translate.detectLanguage(received_message.text)
            console.log(lang)
            if (lang !== 'en'){
                tralnsation = await translate.translateTo(received_message.text, 'en', lang);
                console.log(tralnsation)
                generatedText = await llama2.llama2({text:tralnsation}, sender_psid);
                jsonResponse = await translate.translateTo(generatedText, lang, 'en');
                db.storeHistory({ usr: tralnsation, bot: generatedText }, sender_psid);
            }else{
                jsonResponse = await llama2.llama2(received_message, sender_psid);
                db.storeHistory({ usr: received_message.text, bot: jsonResponse }, sender_psid);
            }
             // Pass the text property
            console.log('jsonResponse:', jsonResponse);
            //textResponse = jsonResponse.text; // Assuming the text property contains the response
            
            senderAction(sender_psid, 'typing_off');

            callSendAPI(sender_psid, { text: jsonResponse });
        } catch (error) {
            console.error('Error:', error);
            // Handle the error as needed
        }
    } else if (received_message.attachments) {
        let attachment_url = received_message.attachments[0].payload.url;

        try {
            const response = await fetch('https://ybelkada-blip-api.hf.space/run/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: [attachment_url],
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch image prediction. Status: ${response.status}`);
            }

            const predictionData = await response.json();
            let data = predictionData.data[0];

            db.storeHistory({ usr: `An image of ${data}`, bot: '' }, sender_psid);
            console.log(attachment_url);
            senderAction(sender_psid, 'mark_seen');
        } catch (error) {
            console.error('Error in image processing:', error);
            // Handle the error as needed
        }
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
