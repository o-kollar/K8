const request = require('request');
const axios = require('axios');
const LLM = require('../../models/GPT');
const db = require('../../db/pouch');
const functions = require('../../models/functions/functions')

let model = 'gpt-3.5-turbo-16k-0613'


async function handleMessage(sender_psid, received_message) {
    let response;
    let textResponse;
    senderAction(sender_psid, 'mark_seen');
    // Check if the message contains text
    if (received_message.text) {
        senderAction(sender_psid, 'typing_on');
        jsonResponse = await LLM.completions(model, received_message, sender_psid);
        textResponse = jsonResponse.choices[0].message.content;
        console.log('res', jsonResponse);

        if (jsonResponse.choices[0].finish_reason === 'function_call') {
            const functionName = jsonResponse.choices[0].message.function_call.name;
            const functionArguments = jsonResponse.choices[0].message.function_call.arguments;

            if (jsonResponse.choices[0].message.content) {
                console.log('message content',jsonResponse.choices[0].message.content);
            }

            if (functionName === 'generate_image') {
                try {
                    const imageurl = await functions.generateImage(functionArguments);
                    response = {
                        attachment: {
                            type: 'image',
                            payload: {
                                url: imageurl,
                                is_reusable: true,
                            },
                        },
                    }
                } catch (error) {
                   console.log(error)
                }
            }
             else if (functionName === 'get_weather_data') {
                let weatherData = await functions.fetchWeatherData(functionArguments)
                    
                resp = await LLM.completions(model,{text:`get_weather_data returned the following: ${JSON.stringify(weatherData)},reply to this query based on the data ${received_message}`} , sender_psid);
                textResponse = resp.choices[0].message.content;
                
                response = {text:textResponse}
                
            }
            else if (functionName === 'search_wikipedia') {
                
                   
               let wiki = await functions.getWikipediaSummary(functionArguments);
               console.log(wiki)
                resp = await LLM.completions(model,{text:`search_wikipedia returned the following: ${wiki}, consider this in your reply ${received_message}`} , sender_psid);
                textResponse = resp.choices[0].message.content;
                
                response = {text:textResponse}
                
            }
        } else {
            response = { text: textResponse };
        }
        senderAction(sender_psid, 'typing_off');
        db.storeHistory({ usr: received_message.text, bot: textResponse }, sender_psid);
        callSendAPI(sender_psid, response);
    } else if (received_message.attachments) {
        let attachment_url = received_message.attachments[0].payload.url;
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
