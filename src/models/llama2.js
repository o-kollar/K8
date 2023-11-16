const axios = require('axios');
const db = require('../db/pouch');
const time = require('./utils/date')

async function llama2(input,userID) {
    let conversationHistory = await db.retrieveHistory(userID);
    let userInfo = await db.getUserInfo(userID);
    console.log('input:',input)
    console.log('user:',userInfo)

    const requestData = {
        prompt: `[INST]It's ${time.setTimestamp()}[/INST][INST]Hello I'm ${userInfo.first_name}[/INST],${conversationHistory}[INST]${input.text}[/INST]\n`,
        version: 'f4e2de70d66816a838a89eeeb621910adffb0dd0baba3976c96980970978018d',
        systemPrompt: 'You are K8, an AI assistant with a friendly demeanor. Your responses are concise, informative, and infused with a touch of humor',
        temperature: 0.75,
        topP: 0.9,
        maxTokens: 800,
    };

    const url = 'https://www.llama2.ai/api';

    try {
        const response = await axios.post(url, requestData, {
            headers: {
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-GB,en;q=0.9',
                'Content-Type': 'text/plain;charset=UTF-8',
                Host: 'www.llama2.ai',
                Origin: 'https://www.llama2.ai',
                Referer: 'https://www.llama2.ai/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15',
            },
        });

        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error in llama2:', error);
        throw error; // Rethrow the error to handle it in the calling function
    }
}

module.exports = {
    llama2,
};
