const axios = require('axios');

async function getWikipediaSummary(title) {
    try {
        // Encode the title for the URL
        const encodedTitle = encodeURIComponent(title);

        // Define the Wikipedia API URL with the encoded title
        const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&titles=${encodedTitle}`;

        // Make the API request to Wikipedia
        const response = await axios.get(apiUrl);

        const page = Object.values(response.data.query.pages)[0];

        if (page.extract) {
            // Return the summary (extract) of the Wikipedia page
            return page.extract;
        } else {
            return "No information found for the title.";
        }
    } catch (error) {
        console.error('Error querying Wikipedia API:', error);
        throw error;
    }
}

// Usage example:
getWikipediaSummary('Robert Fico')
    .then((summary) => {
        console.log('Wikipedia Summary:', summary);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
