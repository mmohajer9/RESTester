import axios from 'axios';

const getAxiosInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL: baseURL,
  });

  return instance;
};
