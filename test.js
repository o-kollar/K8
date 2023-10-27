const axios = require('axios');

const API_URL = 'https://api.naga.ac/v1/embeddings';
const API_KEY = 'GtS_5h93ytGx0bFm21dHrubl_6pODJ94fBPnYBKlrc4';

const data = {
  input: 'The food was delicious and the waiter...',
  model: 'text-embedding-ada-002',
  encoding_format: 'float'
};

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

axios.post(API_URL, data, { headers })
  .then(response => {
    console.log(response.data.data[0].embedding);
  })
  .catch(error => {
    console.error('Error:', error);
  });
