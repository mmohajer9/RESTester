import axios from 'axios';

const getAxiosInstance = (baseURL, headers = {}) => {
  const instance = axios.create({
    baseURL: baseURL,
    headers: headers,
  });
  
  return instance;
};

export default getAxiosInstance;
