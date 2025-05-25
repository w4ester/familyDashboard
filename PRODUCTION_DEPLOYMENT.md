# Production Deployment Guide

## Prerequisites
- Node.js 18+ and npm
- A server or hosting platform (Vercel, Netlify, DigitalOcean, etc.)
- Domain name (optional)
- SSL certificate (for HTTPS)

## 1. Environment Setup

### Create Production Environment File
```bash
# Create .env.production
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_TOOLS_API_URL=https://your-domain.com:3031
REACT_APP_MCP_API_URL=https://your-domain.com:3030
NODE_ENV=production
```

## 2. Build for Production

```bash
# Install dependencies
npm install --production

# Build the React app
npm run build

# Build creates an optimized production build in the 'build' folder
```

## 3. Backend Server Setup

### Create Production Server Configuration
Create `server/production-server.js`:

```javascript
const express = require('express');
const path = require('path');
const cors = require('cors');
const https = require('https');
const fs = require('fs');

// Import both servers
const toolsServer = require('./tools-api/server');
const mcpServer = require('./mcp/src/mcp-filesystem-server');

const app = express();

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-domain.com'],
  credentials: true
}));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../build')));

// API routes
app.use('/api/tools', toolsServer);
app.use('/api/mcp', mcpServer);

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// HTTPS configuration
const httpsOptions = {
  key: fs.readFileSync('./ssl/private.key'),
  cert: fs.readFileSync('./ssl/certificate.crt')
};

const PORT = process.env.PORT || 443;

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`Production server running on https://localhost:${PORT}`);
});
```

## 4. Database & Persistence

### Option A: Cloud Storage (Recommended)
Use a cloud database instead of local files:

```javascript
// server/tools-api/cloud-persistence.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

class CloudPersistence {
  async loadData() {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: 'family-data/family-data.json'
    };
    
    try {
      const data = await s3.getObject(params).promise();
      return JSON.parse(data.Body.toString());
    } catch (error) {
      return this.getDefaultData();
    }
  }
  
  async saveData(data) {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: 'family-data/family-data.json',
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json'
    };
    
    await s3.putObject(params).promise();
  }
}
```

### Option B: PostgreSQL/MySQL
```javascript
// server/tools-api/db-persistence.js
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

class DatabasePersistence {
  async loadData() {
    const result = await pool.query(
      'SELECT data FROM family_data WHERE family_id = $1',
      [familyId]
    );
    return result.rows[0]?.data || this.getDefaultData();
  }
  
  async saveData(data) {
    await pool.query(
      'INSERT INTO family_data (family_id, data) VALUES ($1, $2) ' +
      'ON CONFLICT (family_id) DO UPDATE SET data = $2',
      [familyId, JSON.stringify(data)]
    );
  }
}
```

## 5. Security Configuration

### Authentication Setup
```javascript
// server/auth/auth-middleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply to all API routes
app.use('/api/*', authMiddleware);
```

## 6. Deployment Options

### Option A: Vercel
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server/production-server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/production-server.js"
    },
    {
      "src": "/(.*)",
      "dest": "server/production-server.js"
    }
  ]
}
```

### Option B: Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/tools-api/package*.json ./server/tools-api/
COPY server/mcp/package*.json ./server/mcp/

# Install dependencies
RUN npm ci --production
RUN cd server/tools-api && npm ci --production
RUN cd server/mcp && npm ci --production

# Copy application files
COPY . .

# Build React app
RUN npm run build

# Expose port
EXPOSE 443

# Start server
CMD ["node", "server/production-server.js"]
```

### Option C: PM2 Process Manager
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'family-dashboard',
    script: './server/production-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 443
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## 7. Nginx Configuration (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:3031;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 8. Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up proper CORS origins
- [ ] Implement authentication
- [ ] Configure database backups
- [ ] Set up monitoring (e.g., Sentry, LogRocket)
- [ ] Configure rate limiting
- [ ] Set up CDN for static assets
- [ ] Implement proper logging
- [ ] Test all API endpoints
- [ ] Load test the application
- [ ] Set up CI/CD pipeline

## 9. Monitoring Setup

```javascript
// Add to production-server.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: "production",
  tracesSampleRate: 0.1,
});

// Error handling middleware
app.use(Sentry.Handlers.errorHandler());
```

## 10. Start Commands

```bash
# Development
npm run dev

# Production
NODE_ENV=production npm start

# With PM2
pm2 start ecosystem.config.js

# With Docker
docker build -t family-dashboard .
docker run -p 443:443 --env-file .env.production family-dashboard
```