import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AppDataSource } from './models/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Import routes
const prospectRoutes = require('./routes/prospects');
const campaignRoutes = require('./routes/campaigns');
const analyticsRoutes = require('./routes/analytics');

// Use routes
app.use('/api/prospects', prospectRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, resp) => {
  resp.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;