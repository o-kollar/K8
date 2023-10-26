const request = require('request');
const axios = require('axios');
const LLM = require('../../models/GPT')

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        recipient: {
            id: sender_psid,
        },
        message: response,
    };

    // Send the HTTP request to the Messenger Platform
    request(
        {
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
            method: 'POST',
            json: request_body,
        },
        (err, res, body) => {
            if (!err) {
                console.log('message sent!');
            } else {
                console.error('Unable to send message:' + err);
            }
        }
    );
}

async function handleMessage(sender_psid, received_message) {
    let response;


    // Check if the message contains text
    if (received_message.text) {
        senderAction(sender_psid,'typing_on')
        response = await LLM.completions('gpt-3.5-turbo-0613',received_message,sender_psid)
        console.log('res',response)
        senderAction(sender_psid,'typing_off')
        callSendAPI(sender_psid, response);
    } else if (received_message.attachments) {
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'generic',
                    elements: [
                        {
                            title: 'Is this the right picture?',
                            subtitle: 'Tap a button to answer.',
                            image_url: 'https://api.naga.ac/static/PAdvCrKqzdjXIbLb.png',
                            buttons: [
                                {
                                    type: 'postback',
                                    title: 'Yes!',
                                    payload: 'yes',
                                },
                                {
                                    type: 'postback',
                                    title: 'No!',
                                    payload: 'no',
                                },
                            ],
                        },
                    ],
                },
            },
        };
        callSendAPI(sender_psid, response);
    }
}

function handlePostback(sender_psid, received_postback) {
    let response;
    
    // Get the payload for the postback
    let payload = received_postback.payload;
    console.log(received_postback.payload)
  
    // Set the response based on the postback payload
    if (payload === 'yes') {
      response = { "text": "Thanks!" }
    } else if (payload === 'no') {
      response = { "text": "Oops, try sending another image." }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  }

  function senderAction(sender_psid,action){

    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
    
    const url = `https://graph.facebook.com/v2.6/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    
    const requestData = {
      recipient: {
        id: sender_psid
      },
      sender_action: action
    };
    
    axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log('Message sent successfully', response.data);
      })
      .catch(error => {
        console.error('Error sending message', error);
      });
    
    }

module.exports = {
    callSendAPI,
    handleMessage,
    handlePostback,
    senderAction,
};

