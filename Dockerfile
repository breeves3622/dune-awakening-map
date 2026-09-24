# Use lightweight Node.js LTS Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application files
COPY server.js defaults.js node-manager.js ./
COPY public/ ./public/
COPY data/ ./data/

# Create persistent storage directories
RUN mkdir -p /app/data /app/tiles

# Expose default HTTP port
EXPOSE 8080

# Environment variables
ENV PORT=8080 \
    NODE_ENV=production \
    OFFLINE_MODE=false

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start server
CMD ["node", "server.js"]
