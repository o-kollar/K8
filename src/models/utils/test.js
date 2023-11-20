const axios = require('axios');

const detectionApiUrl = 'https://api.datpmt.com/api/v1/dictionary/detection';
const translationApiUrl = 'https://api.datpmt.com/api/v1/dictionary/translate';
const queryString = 'Ahoj ako sa máš ?';


// Function to detect the language
async function detectLanguage(text) {
  try {
    const response = await axios.get(detectionApiUrl, {
      params: {
        string: text
      }
    });
    return response.data[0]; // Returning the detected language code
  } catch (error) {
    console.error('Error in language detection:', error.message);
    throw error;
  }
}

// Function to translate text to a specific language
async function translateTo(text, toLanguage, fromLanguage) {
  try {
    const response = await axios.get(translationApiUrl, {
      params: {
        string: text,
        to_lang: toLanguage,
        from_lang: fromLanguage // Include the source language
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error in translation to ${toLanguage}:`, error.message);
    throw error;
  }
}

// Function to detect if the language is English and translate back if not
async function translateIfNeeded(text) {
  const detectedLanguage = await detectLanguage(text);
  console.log('Detected language:', detectedLanguage);

  if (detectedLanguage !== 'en') {
    console.log('Translating to English...');
    const translatedToEnglish = await translateTo(text, 'en', detectedLanguage);
    console.log('Translated to English:', translatedToEnglish);

    console.log('Translating back to the original language...');
    const translatedBack = await translateTo(translatedToEnglish, detectedLanguage, 'en');
    console.log('Translated back to original language:', translatedBack);

    return translatedBack;
  } else {
    console.log('Text is already in English.');
    return text;
  }
}
module.exports = {detectLanguage,translateTo}

