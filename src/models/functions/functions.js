const axios = require('axios');

async function fetchWeatherData(dates) {
    // Remove the JSON.parse, and use the dateRange.startDate directly

    const dateRange = JSON.parse(dates)
    const latitude = 48.15;
    const longitude = 17.11;
    const hourlyData = 'temperature_2m,precipitation_probability,precipitation,weathercode';
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=${hourlyData}&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`;

    try {
        const response = await axios.get(apiUrl);
        // Handle the response data here
        console.log(response.data)
       return response.data
    } catch (error) {
        // Handle any errors
        console.error('Error:', error);
    }
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

async function getWikipediaSummary(args) {
    let title;
    let languageCode = 'en';
    t = JSON.parse(args)
    title = t.title
    languageCode = t.language

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

module.exports = {generateImage,fetchWeatherData,getWikipediaSummary}