const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_URL = `${BASE_URL}/api`;
export const IMAGE_URL = BASE_URL;

export default {
    API_URL,
    IMAGE_URL
};
