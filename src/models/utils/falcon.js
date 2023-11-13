const axios = require('axios');
const fs = require('fs');
const db = require('../../db/pouch');
const time = require('../utils/date')

let userInfo;
let hisory
let prompt = 'You are a friendly and youthful AI assistant! called K8 Please respond with a vibrant and energetic tone and humor, and feel free to use emojis to express your youthful spirit! 😊, use the provided data to answer question'


// Function to extract cookies and request ID from the response
function extractInfo(response) {
    const setCookieHeader = response.headers['set-cookie'];
    const requestId = response.headers['x-request-id'];

    const cookies = setCookieHeader ? setCookieHeader.map((cookie) => cookie.split(';')[0]).join('; ') : '';

    return { cookies, requestId };
}

// Function to download and stream the response
async function downloadAndStream(url, config) {
    try {
        const response = await axios({
            ...config,
            url,
            responseType: 'stream',
            maxContentLength: Infinity,
        });

        const statusCode = response.status;
        console.log('Status Code:', statusCode);

        const dataBuffer = [];

        return new Promise((resolve, reject) => {
            response.data.on('data', (chunk) => {
                const buffer1 = Buffer.from(chunk, 'hex');
                const decodedString1 = buffer1.toString('utf-8');
                dataBuffer.push(decodedString1);

                let finalAnswer;
                let totalTokens = 0;

                for (const jsonString of dataBuffer) {
                    const jsonObject = JSON.parse(jsonString);

                    if (jsonObject.type === 'stream') {
                        const tokenCount = jsonObject.token.split(/\s+/).filter(Boolean).length;
                        totalTokens += tokenCount;
                    }

                    if (jsonObject.type === 'finalAnswer') {
                        finalAnswer = jsonObject.text;
                        resolve({ token_count: totalTokens, text: finalAnswer });
                    }
                }
            });

            response.data.on('end', () => {
                // Handle the case where final answer is not found
               // reject('Final answer not found');
            });
        });
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Initial request
const initialRequestData = {
    model: 'tiiuae/falcon-180B-chat',
    preprompt: prompt,
        
};

const initialAxiosConfig = {
    method: 'post',
    url: 'https://huggingface.co/chat/conversation',
    headers: {},
    data: initialRequestData,
};

// Make the initial request
async function completion(input,user,history) {
    userInfo = user;
    hisory = history
    
    let context = `user-info:${JSON.stringify(userInfo)},time:${time.setTimestamp()},history:${hisory}}`
 console.log(context)
    try {
        const response = await axios(initialAxiosConfig);
        const { cookies, requestId } = extractInfo(response);

        const subsequentRequestData = {
            inputs: `use this data to answer question from input data:${context}, input:${input},` ,
            is_retry: false,
            web_search: false,
        };

        const subsequentAxiosConfig = {
            method: 'post',
            url: `https://huggingface.co/chat/conversation/${response.data.conversationId}`,
            headers: {
                Cookie: cookies,
                'x-request-id': requestId,
            },
            data: subsequentRequestData,
        };

        const rep = await downloadAndStream(subsequentAxiosConfig.url, subsequentAxiosConfig);
        console.log("Response:", rep);
        return rep; // Return the response from downloadAndStream
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

module.exports = { completion };
