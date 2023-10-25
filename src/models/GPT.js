const { resolve } = require('path');
const request = require('request');
const utils = require('./utils/readFile');
const db = require('../db/pouch');
const axios = require('axios');

async function completions(model, input,userId) {
    let conversationHistory = await db.retrieveHistory(userId);
    let userInfo = await db.getUserInfo(userId);
    console.log(conversationHistory)
    return new Promise(async (resolve, reject) => {
        utils.readTextFile('src/models/prompt/default.txt', (err, prompt) => {
            let context = `prompt:${prompt}, user:${JSON.stringify(userInfo)} hisory:${conversationHistory}`
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
                                        description: 'the prompt for image generating in english language',
                                    },
                                },
                                required: ['prompt'],
                            },
                        },
                       
                    ],
                };

                console.log(requestBody)

                const options = {
                    method: 'POST',
                    url: 'https://api.naga.ac/v1/chat/completions',
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
                            if (jsonResponse.choices[0].finish_reason === 'function_call') {
                                const functionName = jsonResponse.choices[0].message.function_call.name;
                                const functionArguments = jsonResponse.choices[0].message.function_call.arguments;

                                if (functionName === 'generate_image') {
                                    try {
                                        const imageurl = await generateImage(functionArguments);
                                        resolve({
                                          
                                                attachment:{
                                                  type:"image", 
                                                  payload:{
                                                    url:imageurl, 
                                                    is_reusable:true
                                                  }
                                                }
                                              
                                        });
                                    } catch (error) {
                                        reject(error);
                                    }
                                } else if (functionName === 'wikipedia_summary') {
                                    getWikipediaSummary(functionArguments)
                                    .then((summary) => {
                                        console.log('Wikipedia Summary:', summary);
                                    })
                                    .catch((error) => {
                                        console.error('Error:', error);
                                    });
                                }
                            } else {
                                const textResponse = jsonResponse.choices[0].message.content;
                                db.storeHistory({usr:input.text,bot:textResponse},userId)
                                resolve({ text: textResponse });
                                
                            }
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

async function generateImage(prompt) {
    const apiUrl = 'https://api.naga.ac/v1/images/generations';
    const accessToken = `Bearer ${process.env.NAGA_API_KEY}`;

    const requestData = {
        model: 'kandinsky-2.2',
        prompt: prompt,
        size: '1024x1024',
        n: 1,
        response_format: 'url',
        premium: true,
    };

    const headers = {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: accessToken,
    };

    try {
        const response = await axios.post(apiUrl, requestData, { headers });
        console.log('image-url:', response.data.data[0].url);
        return response.data.data[0].url;
    } catch (error) {
        console.error('Error making the API call:', error);
        throw error; 
    }
}


async function getWikipediaSummary(title, languageCode = 'en') {
    try {
        // Encode the title and language code for the URL
        const encodedTitle = encodeURIComponent(title);
        const encodedLanguageCode = encodeURIComponent(languageCode);

        // Define the Wikipedia API URL with the encoded title and language code
        const apiUrl = `https://${encodedLanguageCode}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&titles=${encodedTitle}`;

        // Make the API request to Wikipedia
        const response = await axios.get(apiUrl);

        const page = Object.values(response.data.query.pages)[0];

        if (page.extract) {
            // Return the summary (extract) of the Wikipedia page
            return page.extract;
        } else {
            return "No information found for the title in the specified language.";
        }
    } catch (error) {
        console.error('Error querying Wikipedia API:', error);
        throw error;
    }
}

module.exports = {
    completions,
};
