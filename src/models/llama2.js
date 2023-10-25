const axios = require('axios');



function llama2(input){
    const requestData = {
        prompt: `[INST]${input}[/INST]\n`,
        version: '02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3',
        systemPrompt: `
   

        `,
        temperature: 0.75,
        topP: 0.9,
        maxTokens: 200,
    };
    
    const url = 'https://www.llama2.ai/api';
    
    axios
        .post(url, requestData, {
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
        })
        .then((response) => {
            console.log(response.data);
        });
    
}

module.exports = {
   llama2
};
