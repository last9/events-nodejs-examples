# Use Node.js 24 LTS Alpine for smaller image size (Node 20 is end-of-life)
FROM node:24.22.0-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY last9-events-emitter.js ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Switch to non-root user
USER nodejs

# Run the application
CMD ["node", "last9-events-emitter.js"]