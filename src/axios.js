const axios = require('axios');

const getAxiosInstance = (baseURL) => {
  const instance = axios.create({
    baseURL: baseURL,
  });

  return instance;
};

module.exports = getAxiosInstance;
