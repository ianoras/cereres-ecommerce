import dotenv from 'dotenv';
dotenv.config();

export const config = {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/cereres',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiration: '24h',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    clientURL: process.env.CLIENT_URL || 'http://localhost:3000',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@cereres.com',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin_password_sicura'
}; 