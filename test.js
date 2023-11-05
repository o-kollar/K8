const axios = require('axios');

// Function to fetch data with a dynamic search term
async function fetchDataWithTerm(searchTerm) {
  const apiUrl = `https://next-gooogle.vercel.app/_next/data/zzfG2L0-r_OZSAGNnUMl5/search.json?term=${encodeURIComponent(searchTerm)}`;

  try {
    const response = await axios.get(apiUrl);
    // Handle the response data here
    const resp = response.data
    console.log('Response data:', JSON.stringify(resp.pageProps.results.items));
  } catch (error) {
    // Handle any errors
    console.error('Error:', error);
  }
}

// Call the function with the desired search term
const searchTerm = 'premier slovenska';

fetchDataWithTerm(searchTerm);
