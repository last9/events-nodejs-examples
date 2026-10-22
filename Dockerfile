# Node.js 24 LTS Alpine, pinned by tag and digest. 24.22.1 is the first 24.x
# that rejects chains on the TLS blocklist (eMudhra, nodejs/node#66871).
FROM node:24.22.1-alpine@sha256:6a1c190e17215d844926b0677f4bf87273ff7d5e54db06d3b5b5863ab0b09a3d

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