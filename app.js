require('dotenv').config();

const request = require('request'),
    express = require('express'),
    body_parser = require('body-parser'),
    routes = require('./src/api/router'),
    app = express().use(body_parser.json());
    msg = require('./src/chat/utils/actions')

msg.setMenu()
app.use('/', routes);
app.listen(process.env.PORT, () => console.log(`webhook is listening on ${process.env.PORT}`));
