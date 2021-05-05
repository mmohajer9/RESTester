const axios = require("axios");
const JSONConfig = require('./config.json');

const instance = axios.create({
    baseURL: 'https://petstore3.swagger.io/api/v3',
});

module.exports = instance;



