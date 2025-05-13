import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import filesystemRoutes from './routes/filesystem';
import mcpRoutes from './routes/mcp';

// Import logger
import { logger } from './utils/logger';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3030;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(morgan('dev'));
app.use(bodyParser.json());

// Ensure required directories exist
const rootDir = process.env.ROOT_DIR || './';
const dataDirs = (process.env.ALLOWED_DIRS || './data,./uploads').split(',');

for (const dir of dataDirs) {
  const fullPath = path.join(rootDir, dir);
  fs.ensureDirSync(fullPath);
  logger.info(`Ensured directory exists: ${fullPath}`);
}

// Routes
app.use('/api/filesystem', filesystemRoutes);
app.use('/mcp', mcpRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`MCP Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

export default app;