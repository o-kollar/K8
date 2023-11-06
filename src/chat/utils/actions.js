const 
    accessToken = process.env.PAGE_ACCESS_TOKEN;
    axios = require('axios');



  function setMenu(){
    const menuData = {
        persistent_menu: [
          {
            locale: 'default',
            composer_input_disabled: false,
            call_to_actions: [
              {
                type: 'postback',
                title: 'Obliviate !',
                payload: 'RESET',
              },
              {
                type: 'postback',
                title: 'switch',
                payload: 'SWITCH',
              },
            ],
          },
        ],
      };
      
      axios.post(`https://graph.facebook.com/v18.0/me/messenger_profile?access_token=${accessToken}`, menuData, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => {
          console.log('Persistent menu response:', response.data);
        })
        .catch((error) => {
          console.error('Error sending persistent menu:', error);
        });
  }

module.exports = { setMenu}