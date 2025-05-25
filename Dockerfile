# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/tools-api/package*.json ./server/tools-api/

# Install dependencies
RUN npm ci
RUN cd server/tools-api && npm ci

# Copy source code
COPY . .

# Build React app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY server/tools-api/package*.json ./server/tools-api/
RUN npm ci --production
RUN cd server/tools-api && npm ci --production

# Copy built app and server files
COPY --from=builder /app/build ./build
COPY server ./server

# Create directories
RUN mkdir -p family-data/uploads logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "server/production-server.js"]