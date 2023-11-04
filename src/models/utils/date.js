function setTimestamp(){
    const currentDate = new Date();

    // Adjust the current date by one hour
    currentDate.setHours(currentDate.getHours() + 1);
    
    // Get the day of the week as a number (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = currentDate.getUTCDay();
    
    // Convert the number to the day's name
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = daysOfWeek[dayOfWeek];
    
    // Format the date and time in UTC
    const formattedDate = currentDate.toISOString().split('T')[0];
    const formattedTime = currentDate.toISOString().split('T')[1].split('.')[0];
    
    // Combine the day, date, and time
    const result = `${currentDay}: ${formattedDate}T${formattedTime}`;
    
    return result
}

module.exports = {setTimestamp}