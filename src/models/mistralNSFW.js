const axios = require('axios');
const db = require('../db/pouch');
const time = require('./utils/date')

async function llama2(input,userID) {
    let conversationHistory = await db.retrieveHistory(userID);
    let userInfo = await db.getUserInfo(userID);
    console.log('input:',input)
    console.log('user:',userInfo)


    const requestData = {
        prompt: `[INST]${input.text}[/INST]\n`,
        version: '83b6a56e7c828e667f21fd596c338fd4f0039b46bcfa18d973e8e70e455fda70',
        temperature: 0.1,
        topP: 0.9,
        maxTokens: 500,
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

        let resultString = response.data
        let index = resultString.indexOf("[INST]");
        
 
// Check if [INST] is found in the string
if (index !== -1) {
  // Remove everything after [INST]
   resultString = resultString.substring(0, index);
} 
        return resultString;
    } catch (error) {
        console.error('Error in llama2:', error);
        throw error; // Rethrow the error to handle it in the calling function
    }
}

module.exports = {
    llama2,
};
