const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const rawMongoUri = process.env.MONGO_URI || '';
const isLocalhost = rawMongoUri.includes('localhost') || rawMongoUri.includes('127.0.0.1') || rawMongoUri === '';
const defaultAtlasUri = 'mongodb+srv://manjeetmaurya7785_db_user:f9Q4YLCbY2Y26jSX@alldata.a9zrfm3.mongodb.net/ito';

const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: parseInt(process.env.PORT, 10),
  MONGO_URI: (process.env.RENDER && isLocalhost) ? defaultAtlasUri : (process.env.MONGO_URI || defaultAtlasUri),
  JWT_SECRET: process.env.JWT_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  JWT_EXPIRY: process.env.JWT_EXPIRY,
  REFRESH_TOKEN_EXPIRY: '7d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10),
  CORS_WHITELIST: process.env.CORS_WHITELIST ? process.env.CORS_WHITELIST.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  DEVICE_VERIFICATION_ENABLED: process.env.DEVICE_VERIFICATION_ENABLED,
  GOOGLE_USER_EMAIL: process.env.GOOGLE_USER_EMAIL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN
};

module.exports = env;
