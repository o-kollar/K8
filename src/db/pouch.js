// Include the PouchDB library (you should already have it installed)
const PouchDB = require('pouchdb');
const axios = require('axios');

function storeHistory(conv,user){

    // Create a new PouchDB database or open an existing one
const db = new PouchDB('history');
let lastMessage = `user:${conv.usr},bot:${conv.bot}`
// Define the note to be stored
let History = {
    _id: new Date().toISOString(),
    userId:user, 
    conversation: [],
    
};
History.conversation.push(lastMessage)

db.put(History)
    .then((response) => {
        console.log('Note added:', response);
    })
    .catch((error) => {
        console.error('Error adding note:', error);
    });

}

async function retrieveHistory(user) {
    // Create or open the PouchDB database
    console.log('userID:', user);
    const db = new PouchDB('history');

    try {
        // Use the allDocs method to get all documents
        const result = await db.allDocs({ include_docs: true, descending: false, limit: 10 });

        // Extract and filter the conversation history based on userId
        const histories = result.rows
            .map((row) => row.doc)
            .filter((doc) => doc.userId === user)
            .map((doc) => doc.conversation);

        return histories;
    } catch (error) {
        console.error('Error retrieving history:', error);
        throw error; // Rethrow the error so it can be caught in the calling function
    }
}



async function getUserInfo(user) {
    const db = new PouchDB('user');
    try {
        // Check the database for the user's information
        const doc = await db.get(user);

        // If the document exists in the database, return a subset of its data
        const userInfo = {
            first_name: doc.first_name,
            locale: doc.locale,
        };

        return userInfo;
    } catch (error) {
        if (error.status === 404) {
            // If the document doesn't exist (status 404), make an API request to retrieve the user's information
            const url = `https://graph.facebook.com/${user}?fields=first_name,locale&access_token=${process.env.PAGE_ACCESS_TOKEN}`;
            
            try {
                const response = await axios.get(url);
                const userInfo = response.data;

                // Store the user's information in the database
                await db.put({
                    _id: user,
                    ...userInfo
                });

                // Return the subset of user information
                const { first_name, locale } = userInfo;
                return { first_name, locale };
            } catch (apiError) {
                console.error('Error retrieving user info from the API:', apiError);
                throw apiError;
            }
        } else {
            console.error('Error retrieving user info from the database:', error);
            throw error;
        }
    }
}

module.exports = {
    storeHistory,
    retrieveHistory,
    getUserInfo
};