const { resolve } = require('path');
const request = require('request');
const utils = require('./utils/readFile');
const time = require('./utils/date')
const db = require('../db/pouch');
const axios = require('axios');
const { callSendAPI } = require('../chat/utils/messenger');

async function completions(model, input,userId) {
    let conversationHistory = await db.retrieveHistory(userId);
    let userInfo = await db.getUserInfo(userId);
    console.log(conversationHistory)
    console.log(time.setTimestamp())
    return new Promise(async (resolve, reject) => {
        utils.readTextFile('src/models/prompt/default.txt', (err, prompt) => {
            let context = `prompt:${prompt}, user:${JSON.stringify(userInfo)} hisory:${conversationHistory} time:${time.setTimestamp()}`
            if (err) {
                console.error('Error reading the text file:', err);
                reject(err);
            } else {
                const requestBody = {
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: context,
                        },
                        {
                            role: 'user',
                            content: input.text,
                        },
                    ],
                    functions: [
                        {
                            name: 'generate_image',
                            description: 'user wants to generate an image',
                            parameters: {
                                type: 'object',
                                properties: {
                                    prompt: {
                                        type: 'string',
                                        description: 'the prompt for best result of generating the image in english language',
                                    },
                                },
                                required: ['prompt'],
                            },
                        },
                        {
                            name: 'get_weather_data',
                            description: 'user wants weather info',
                            parameters: {
                                type: 'object',
                                properties: {
                                    startDate: {
                                        type: 'string',
                                        description: 'start date in this format YYYY-MM-DD',
                                    },
                                    endDate: {
                                        type: 'string',
                                        description: 'end date in this format YYYY-MM-DD',
                                    },
                                },
                                required: ['startDate','endDate'],
                            },
                        },                  
                    ],
                };

                const options = {
                    method: 'POST',
                    url: `${process.env.NAGA_BASE_URL}/v1/chat/completions`,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.NAGA_API_KEY}`,
                    },
                    body: JSON.stringify(requestBody),
                };

                request(options, async (error, response, body) => {
                    if (error) {
                        console.error('Error making the request:', error);
                        reject(error);
                    } else {
                        try {
                            console.log('response body:', body);
                            const jsonResponse = JSON.parse(body);
                            resolve(jsonResponse);
                        } catch (parseError) {
                            console.error('Error parsing JSON:', parseError);
                            reject(parseError);
                        }
                    }
                });
            }
        });
    });
}

async function Embed(content) {
    const API_URL = 'https://api.naga.ac/v1/embeddings';
    const API_KEY = 'GtS_5h93ytGx0bFm21dHrubl_6pODJ94fBPnYBKlrc4';

    const data = {
        input: content,
        model: 'text-embedding-ada-002',
        encoding_format: 'float'
    };

    const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    };

    return axios.post(API_URL, data, { headers })
        .then(response => {
            console.log(response.data.data[0].embedding);
            return response.data.data[0].embedding;
        })
        .catch(error => {
            console.error('Error:', error);
            throw error;
        });
}







module.exports = {
    completions,
};

