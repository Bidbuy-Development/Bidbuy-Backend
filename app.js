import express from "express";
import connectDB from "./config/db.js";
import dotenv from 'dotenv';
import authRoutes from './routes/auth_routes.js';
import cors from 'cors';
import logger from './middleware/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

// Serve static files from public directory
app.use(express.static('public', {
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }
}));

// Mount all auth routes under /api/auth
app.use('/api/auth', authRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to BidBuy API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error', { 
        error: err.message, 
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    
    res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`, { 
        environment: process.env.NODE_ENV || 'development',
        port: PORT 
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    // logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    //     error: err.message,
    //     stack: err.stack,
    //     name: err.name
    // });

    logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
    
    server.close(() => {
        process.exit(1);
    });
});
