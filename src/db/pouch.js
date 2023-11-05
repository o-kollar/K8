// Include the PouchDB library (you should already have it installed)
const PouchDB = require('pouchdb');
const axios = require('axios');

async function storeHistory(conv, user) {
    const db = new PouchDB('history');
    try {
        // Check if the user's history exists in the database
        const existingDoc = await db.get(user);

        // If the user's history document already exists, update it with the new conversation
        existingDoc.conversation.push(`user:${conv.usr},bot:${conv.bot}`);
        if (existingDoc.conversation.length > 20) {
            // Keep only the last 10 entries
            existingDoc.conversation = existingDoc.conversation.slice(-20);
        }

        // Update the document in the database
        await db.put(existingDoc);
        console.log('User history updated:', existingDoc);
    } catch (error) {
        if (error.status === 404) {
            // If the user's history document does not exist (status 404), create a new one
            const newHistory = {
                _id: user,
                userId: user,
                conversation: [`user:${conv.usr},bot:${conv.bot}`],
            };
            await db.put(newHistory);
            console.log('New user history created:', newHistory);
        } else {
            console.error('Error updating/creating user history:', error);
        }
    }
}

async function deleteEntriesForUser(userId) {
    const db = new PouchDB('history');

    try {
        // Fetch the user's document from the database
        const userDoc = await db.get(userId);

        // Delete the user's document
        await db.remove(userDoc);

        console.log(`Deleted all entries for user with ID: ${userId}`);
    } catch (error) {
        if (error.status === 404) {
            console.log(`No entries found for user with ID: ${userId}`);
        } else {
            console.error('Error deleting entries:', error);
        }
    }
}



async function retrieveHistory(user) {
    // Create or open the PouchDB database
    console.log('userID:', user);
    const db = new PouchDB('history');

    try {
        // Use the allDocs method to get all documents
        const result = await db.allDocs({ include_docs: true, descending: false, limit: 50 });

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
                console.log(userInfo)

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
    getUserInfo,
    deleteEntriesForUser
};